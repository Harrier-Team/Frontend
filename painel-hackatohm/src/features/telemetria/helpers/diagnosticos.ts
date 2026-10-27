import { NivelSeveridade, ResultadoGateRealtime } from '@/features/quality-gates/types/qualityGate';
import { TIPO_ASSIMETRIA } from '@/features/quality-gates/helpers/tiposRegra';
import { LeituraEscova } from '@/features/telemetria/types/telemetria';
import { ehSeveridadeAnormal, estadoResultado, RANK_SEVERIDADE } from './estadoHelper';

export type EscopoDiagnostico = 'escova' | 'motor';

export interface ItemDiagnostico {
  /** null quando o resultado pertence ao motor (assimetria). */
  numeroEscova: number | null;
  resultado: ResultadoGateRealtime;
}

export interface GrupoDiagnostico {
  chave: string;
  nomeRegra: string;
  tipoRegra: string;
  escopo: EscopoDiagnostico;
  itens: ItemDiagnostico[];
  /** Maior severidade avaliada do grupo; null se nada foi avaliado. */
  severidade: NivelSeveridade | null;
  /** Nenhum item pôde ser avaliado ainda. */
  aguardando: boolean;
}

export function emAlerta(resultado: ResultadoGateRealtime): boolean {
  return estadoResultado(resultado) === 'avaliado' && ehSeveridadeAnormal(resultado.severidade);
}

function pesoResultado(resultado: ResultadoGateRealtime): number {
  if (estadoResultado(resultado) === 'aguardando-amostras') return -1;
  return RANK_SEVERIDADE[resultado.severidade];
}

/**
 * Agrupa os resultados do último lote por regra. A assimetria pertence ao
 * motor: o backend repete o mesmo resultado em cada escova, mas aqui aparece
 * uma vez, com o resultado de maior severidade entre as repetições.
 */
export function agruparDiagnosticos(
  leituras: Array<Pick<LeituraEscova, 'numeroEscova' | 'resultadosQualityGates'>>
): GrupoDiagnostico[] {
  const grupos = new Map<string, GrupoDiagnostico>();
  const ordenadas = [...leituras].sort((a, b) => a.numeroEscova - b.numeroEscova);

  for (const leitura of ordenadas) {
    for (const resultado of leitura.resultadosQualityGates ?? []) {
      const escopo: EscopoDiagnostico = resultado.tipoRegra === TIPO_ASSIMETRIA ? 'motor' : 'escova';
      const chave = resultado.regraQualidadeId || `${resultado.tipoRegra}:${resultado.nomeRegra}`;
      let grupo = grupos.get(chave);
      if (!grupo) {
        grupo = {
          chave,
          nomeRegra: resultado.nomeRegra || 'Regra',
          tipoRegra: resultado.tipoRegra,
          escopo,
          itens: [],
          severidade: null,
          aguardando: true,
        };
        grupos.set(chave, grupo);
      }

      if (escopo === 'motor') {
        const atual = grupo.itens[0];
        if (!atual) {
          grupo.itens.push({ numeroEscova: null, resultado });
        } else if (pesoResultado(resultado) > pesoResultado(atual.resultado)) {
          grupo.itens[0] = { numeroEscova: null, resultado };
        }
      } else {
        grupo.itens.push({ numeroEscova: leitura.numeroEscova, resultado });
      }
    }
  }

  const lista = [...grupos.values()];
  for (const grupo of lista) {
    const avaliados = grupo.itens.filter((i) => estadoResultado(i.resultado) === 'avaliado');
    grupo.aguardando = avaliados.length === 0;
    grupo.severidade = avaliados.length
      ? avaliados.reduce<NivelSeveridade>(
          (maior, i) =>
            RANK_SEVERIDADE[i.resultado.severidade] > RANK_SEVERIDADE[maior]
              ? i.resultado.severidade
              : maior,
          'Normal'
        )
      : null;
    // Alertas primeiro dentro do grupo, depois por escova.
    grupo.itens.sort(
      (a, b) =>
        pesoResultado(b.resultado) - pesoResultado(a.resultado) ||
        (a.numeroEscova ?? 0) - (b.numeroEscova ?? 0)
    );
  }

  return lista.sort(
    (a, b) =>
      RANK_SEVERIDADE[b.severidade ?? 'Normal'] - RANK_SEVERIDADE[a.severidade ?? 'Normal'] ||
      a.nomeRegra.localeCompare(b.nomeRegra, 'pt-BR')
  );
}

export interface ResumoDiagnosticos {
  alertas: number;
  criticos: number;
  dentroDoLimite: number;
  aguardando: number;
}

/** Contagem de resultados (não de grupos), com a assimetria contada uma vez. */
export function resumirDiagnosticos(grupos: GrupoDiagnostico[]): ResumoDiagnosticos {
  const resumo: ResumoDiagnosticos = { alertas: 0, criticos: 0, dentroDoLimite: 0, aguardando: 0 };
  for (const grupo of grupos) {
    for (const { resultado } of grupo.itens) {
      if (estadoResultado(resultado) === 'aguardando-amostras') resumo.aguardando += 1;
      else if (emAlerta(resultado)) {
        resumo.alertas += 1;
        if (resultado.severidade === 'Critico') resumo.criticos += 1;
      } else resumo.dentroDoLimite += 1;
    }
  }
  return resumo;
}
