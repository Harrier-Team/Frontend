import { AlertaManutencao } from '@/features/alertas/types/alerta';
import { NivelSeveridade } from '@/features/quality-gates/types/qualityGate';
import { LeituraEscova } from '@/features/telemetria/types/telemetria';

const ANORMAIS: NivelSeveridade[] = ['Atencao', 'AlertaPreditivo', 'Critico'];
const RANK: Record<string, number> = { Atencao: 1, AlertaPreditivo: 2, Critico: 3 };

/** Categoria que o backend atribui a cada tipo de regra. */
export function categoriaDoTipo(tipoRegra: string): string {
  switch (tipoRegra) {
    case 'temperatura.previsao_tendencia':
      return 'Preditivo';
    case 'temperatura.gradiente_termico':
      return 'Aceleracao';
    default:
      return 'Condicao';
  }
}

const iso = (t: number) => new Date(t).toISOString();

export interface ConsultaAlertasSimulada {
  motorId?: number;
  ativo?: boolean;
  categoria?: string;
  tipoRegra?: string;
  severidade?: string;
  pagina: number;
  tamanho: number;
}

/** Interpreta a query de `GET /api/alertas`; devolve a mensagem do 400 quando algum parâmetro é inválido. */
export function lerConsulta(query: URLSearchParams): ConsultaAlertasSimulada | string {
  const inteiro = (nome: string, padrao: number): number | null => {
    const bruto = query.get(nome);
    if (bruto === null) return padrao;
    return /^-?[0-9]+$/.test(bruto) ? Number(bruto) : null;
  };
  const pagina = inteiro('pagina', 1);
  const tamanho = inteiro('tamanho', 50);
  if (pagina === null || pagina < 1) return 'A página deve ser um inteiro a partir de 1.';
  if (tamanho === null || tamanho < 1 || tamanho > 200) return 'O tamanho deve estar entre 1 e 200.';

  const motorBruto = query.get('motorId');
  const motorId = motorBruto === null ? undefined : /^[0-9]+$/.test(motorBruto) ? Number(motorBruto) : null;
  if (motorId === null) return 'motorId inválido.';

  const ativoBruto = query.get('ativo');
  if (ativoBruto !== null && ativoBruto !== 'true' && ativoBruto !== 'false') return 'ativo deve ser true ou false.';

  const categoria = query.get('categoria') ?? undefined;
  if (categoria !== undefined && !['Preditivo', 'Aceleracao', 'Condicao'].includes(categoria)) return 'Categoria inválida.';
  const severidade = query.get('severidade') ?? undefined;
  if (severidade !== undefined && !ANORMAIS.includes(severidade as NivelSeveridade)) return 'Severidade inválida.';

  return {
    motorId,
    ativo: ativoBruto === null ? undefined : ativoBruto === 'true',
    categoria,
    tipoRegra: query.get('tipoRegra') ?? undefined,
    severidade,
    pagina,
    tamanho,
  };
}

/**
 * Alertas de manutenção do simulador, com o mesmo ciclo de vida do backend:
 * um gate que passa a disparar abre um alerta (a chave é regra + sensor; a
 * assimetria gera um por motor), enquanto continua o alerta é atualizado, e
 * quando para (ou a regra é desativada, desvinculada ou excluída) é encerrado.
 */
export class AlertasSimulados {
  private itens: AlertaManutencao[] = [];
  private chaves = new Map<number, string>();
  private proximoId = 1;

  /**
   * Compara os gates de um lote com os alertas abertos do motor. Devolve os que
   * abriram ou subiram de severidade (os únicos que geram evento no hub).
   */
  processar(motorId: number, leituras: LeituraEscova[], t: number): AlertaManutencao[] {
    const disparos = new Map<string, { leitura: LeituraEscova; gate: LeituraEscova['resultadosQualityGates'][number] }>();
    for (const leitura of leituras) {
      for (const gate of leitura.resultadosQualityGates) {
        if (!gate.disparouAlerta || !ANORMAIS.includes(gate.severidade) || gate.metadados?.avaliacaoConcluida === false) continue;
        const doMotor = gate.tipoRegra === 'temperatura.assimetria_escovas';
        const chave = `${gate.regraQualidadeId}|${doMotor ? 'motor' : leitura.numeroEscova}`;
        const existente = disparos.get(chave);
        if (!existente || RANK[gate.severidade] > RANK[existente.gate.severidade]) disparos.set(chave, { leitura, gate });
      }
    }

    const eventos: AlertaManutencao[] = [];
    for (const aberto of this.itens.filter((a) => a.motorId === motorId && a.ativo)) {
      const chave = this.chaves.get(aberto.id) ?? '';
      const disparo = disparos.get(chave);
      if (!disparo) {
        aberto.ativo = false;
        aberto.resolvidoEm = iso(t);
        continue;
      }
      disparos.delete(chave);
      const subiu = RANK[disparo.gate.severidade] > RANK[aberto.severidade];
      Object.assign(aberto, {
        severidade: disparo.gate.severidade,
        codigoRegra: disparo.gate.codigoRegra,
        valorObservado: disparo.gate.valorObservado,
        valorLimite: disparo.gate.valorLimite,
        mensagem: disparo.gate.mensagemDiagnostico ?? '',
        atualizadoEm: iso(t),
      });
      if (subiu) eventos.push({ ...aberto });
    }

    for (const [chave, { leitura, gate }] of disparos) {
      const doMotor = gate.tipoRegra === 'temperatura.assimetria_escovas';
      const novo: AlertaManutencao = {
        id: this.proximoId++,
        motorId,
        sensorId: doMotor ? null : leitura.sensorId,
        numeroEscova: doMotor ? null : leitura.numeroEscova,
        regraQualidadeId: gate.regraQualidadeId,
        nomeRegra: gate.nomeRegra,
        tipoRegra: gate.tipoRegra,
        categoria: categoriaDoTipo(gate.tipoRegra),
        codigoRegra: gate.codigoRegra,
        severidade: gate.severidade,
        valorObservado: gate.valorObservado,
        valorLimite: gate.valorLimite,
        mensagem: gate.mensagemDiagnostico ?? '',
        iniciadoEm: iso(t),
        atualizadoEm: iso(t),
        resolvidoEm: null,
        ativo: true,
      };
      this.itens.push(novo);
      this.chaves.set(novo.id, chave);
      eventos.push({ ...novo });
    }

    // Do mais grave para o menos grave, como o backend publica.
    return eventos.sort((a, b) => RANK[b.severidade] - RANK[a.severidade] || a.id - b.id);
  }

  /** Os alertas somem junto com o motor. */
  removerDoMotor(motorId: number) {
    this.itens = this.itens.filter((a) => a.motorId !== motorId);
  }

  /** Regra excluída: o alerta guarda nome, tipo e código, e perde só o vínculo com a regra. */
  desvincularRegra(regraId: string) {
    for (const alerta of this.itens) if (alerta.regraQualidadeId === regraId) alerta.regraQualidadeId = null;
  }

  /** `GET /api/alertas`: filtros, do mais recente ao mais antigo, paginado. */
  listar(consulta: ConsultaAlertasSimulada) {
    const filtrados = this.itens
      .filter(
        (a) =>
          (consulta.motorId === undefined || a.motorId === consulta.motorId) &&
          (consulta.ativo === undefined || a.ativo === consulta.ativo) &&
          (consulta.categoria === undefined || a.categoria === consulta.categoria) &&
          (consulta.tipoRegra === undefined || a.tipoRegra === consulta.tipoRegra) &&
          (consulta.severidade === undefined || a.severidade === consulta.severidade)
      )
      .sort((a, b) => Date.parse(b.iniciadoEm) - Date.parse(a.iniciadoEm) || b.id - a.id);
    const inicio = (consulta.pagina - 1) * consulta.tamanho;
    return {
      itens: filtrados.slice(inicio, inicio + consulta.tamanho).map((a) => ({ ...a })),
      pagina: consulta.pagina,
      tamanho: consulta.tamanho,
      total: filtrados.length,
    };
  }
}
