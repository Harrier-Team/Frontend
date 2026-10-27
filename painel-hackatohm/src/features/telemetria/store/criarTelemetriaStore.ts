import { leituraDeEscovaStatus } from '@/features/telemetria/helpers/normalizacao';
import { idadeEmSegundos, LIMITE_ATRASO_SEGUNDOS } from '@/features/telemetria/helpers/estadoHelper';
import type { StatusConexaoHub } from '@/features/telemetria/services/signalrService';
import { LeituraEscova, MotorStatusDto } from '@/features/telemetria/types/telemetria';
import { ApiRequestError } from '@/types/api';
import { obterMensagemErro } from '@/utils/errorHelper';
import { instanteDaLeitura, mesclarLeitura, SERIE_VAZIA } from './mesclagem';
import { EstadoTelemetria, MotorTelemetria } from './tipos';

/** Intervalo mínimo entre consultas de status disparadas pelo silêncio. */
export const INTERVALO_MINIMO_CONSULTA_MS = LIMITE_ATRASO_SEGUNDOS * 1000;
const INTERVALO_VIGIA_MS = 5000;

export interface HubTelemetria {
  iniciar(): void;
  onLoteTelemetria(callback: (leituras: LeituraEscova[]) => void): () => void;
  onStatusMotor(callback: (status: MotorStatusDto) => void): () => void;
  onStatusMudou(callback: (status: StatusConexaoHub) => void): () => void;
}

export interface DependenciasStore {
  obterStatus(motorId: number): Promise<MotorStatusDto>;
  agora(): number;
  hub: HubTelemetria | null;
  /** Define `false` em testes para controlar a vigia manualmente. */
  agendarVigia?: boolean;
}

function criarMotor(motorId: number): MotorTelemetria {
  return {
    motorId,
    status: null,
    statusVersao: null,
    statusAtualizadoEm: null,
    escovas: {},
    ultimoLoteEm: null,
    lotesNaSessao: 0,
    carregando: false,
    carregado: false,
    erro: null,
  };
}

function maiorInstante(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(b) > Date.parse(a) ? b : a;
}

/**
 * Store de telemetria por motor. Fonte única para a visão geral e o detalhe:
 *  - amostras só vêm de `ReceberLoteTelemetria`;
 *  - status vem de `ReceberStatusMotor` e de `GET /api/motores/{id}/status`;
 *  - uma leitura mais antiga nunca sobrescreve uma mais nova;
 *  - o mesmo instante nunca duplica ponto nem conta como novo lote;
 *  - o status é recarregado ao conectar, ao reconectar e após silêncio.
 */
export function criarTelemetriaStore(deps: DependenciasStore) {
  let estado: EstadoTelemetria = { motores: {}, conexao: 'desconectado', ultimaAtualizacao: null };
  const ouvintes = new Set<() => void>();
  const ultimaConsultaEm = new Map<number, number>();
  const solicitacao = new Map<number, { emitida: number; aplicada: number }>();
  let usuarios = 0;
  let descartar: Array<() => void> = [];
  let timer: ReturnType<typeof setInterval> | null = null;

  function emitir() {
    ouvintes.forEach((ouvinte) => ouvinte());
  }

  function definir(proximo: EstadoTelemetria) {
    estado = proximo;
    emitir();
  }

  function atualizarMotor(
    motorId: number,
    alterar: (motor: MotorTelemetria) => MotorTelemetria,
    extra: Partial<EstadoTelemetria> = {}
  ) {
    const atual = estado.motores[motorId];
    if (!atual) return;
    definir({ ...estado, ...extra, motores: { ...estado.motores, [motorId]: alterar(atual) } });
  }

  /** Funde leituras no motor. Retorna o motor atualizado e se houve amostra nova. */
  function fundirLeituras(motor: MotorTelemetria, leituras: LeituraEscova[]) {
    let escovas = motor.escovas;
    let ultimoLoteEm = motor.ultimoLoteEm;
    let houveNova = false;

    for (const leitura of leituras) {
      const serie = escovas[leitura.numeroEscova] ?? SERIE_VAZIA;
      const resultado = mesclarLeitura(serie, leitura);
      if (resultado.serie === serie) continue;
      escovas = { ...escovas, [leitura.numeroEscova]: resultado.serie };
      houveNova = houveNova || resultado.novaAmostra;
      ultimoLoteEm = maiorInstante(ultimoLoteEm, leitura.dataHora);
    }

    return { motor: { ...motor, escovas, ultimoLoteEm }, houveNova };
  }

  /* ---------- Entradas ---------- */

  function aplicarLote(leituras: LeituraEscova[]) {
    if (!leituras || leituras.length === 0) return;

    const porMotor = new Map<number, LeituraEscova[]>();
    for (const leitura of leituras) {
      if (leitura.motorId === null || !estado.motores[leitura.motorId]) continue;
      porMotor.set(leitura.motorId, [...(porMotor.get(leitura.motorId) ?? []), leitura]);
    }
    if (porMotor.size === 0) return;

    const motores = { ...estado.motores };
    for (const [motorId, lote] of porMotor) {
      const atual = motores[motorId];
      const instantes = lote.map(instanteDaLeitura).filter((t): t is number => t !== null);
      if (instantes.length === 0) continue;

      const tAnterior = atual.ultimoLoteEm ? Date.parse(atual.ultimoLoteEm) : -Infinity;
      const loteNovo = Math.max(...instantes) > tAnterior;
      const { motor } = fundirLeituras(atual, lote);
      motores[motorId] = {
        ...motor,
        lotesNaSessao: motor.lotesNaSessao + (loteNovo ? 1 : 0),
      };
    }
    definir({ ...estado, motores, ultimaAtualizacao: deps.agora() });
  }

  function versaoDoStatus(status: MotorStatusDto): number | null {
    const instantes = status.escovas
      .map((escova) => Date.parse(escova.dataHora))
      .filter((t) => !Number.isNaN(t));
    return instantes.length > 0 ? Math.max(...instantes) : null;
  }

  /** Retorna false se o status foi recusado por ser mais antigo que o atual. */
  function aplicarStatus(status: MotorStatusDto): boolean {
    const atual = estado.motores[status.motorId];
    if (!atual) return false;

    const versao = versaoDoStatus(status);
    // Status sem leitura nunca substitui um status que já tem leituras.
    if (atual.statusVersao !== null && (versao === null || versao < atual.statusVersao)) {
      return false;
    }

    const leituras = status.escovas.map((escova) => leituraDeEscovaStatus(status.motorId, escova));
    const { motor } = fundirLeituras(atual, leituras);

    definir({
      ...estado,
      motores: {
        ...estado.motores,
        [status.motorId]: {
          ...motor,
          status,
          statusVersao: versao,
          statusAtualizadoEm: deps.agora(),
          carregado: true,
          erro: null,
        },
      },
    });
    return true;
  }

  async function carregarStatus(motorId: number): Promise<void> {
    if (!estado.motores[motorId]) return;

    const controle = solicitacao.get(motorId) ?? { emitida: 0, aplicada: 0 };
    const minha = ++controle.emitida;
    solicitacao.set(motorId, controle);
    ultimaConsultaEm.set(motorId, deps.agora());
    atualizarMotor(motorId, (m) => ({ ...m, carregando: true }));

    try {
      const status = await deps.obterStatus(motorId);
      // Uma consulta posterior já foi aplicada: esta resposta é velha.
      if (minha > controle.aplicada) {
        controle.aplicada = minha;
        aplicarStatus(status);
      }
      atualizarMotor(motorId, (m) => ({ ...m, carregando: false, carregado: true, erro: null }));
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 404) {
        // Motor sem leitura ainda: não é falha.
        atualizarMotor(motorId, (m) => ({ ...m, carregando: false, carregado: true, erro: null }));
        return;
      }
      atualizarMotor(motorId, (m) => ({
        ...m,
        carregando: false,
        erro: obterMensagemErro(error, 'Não foi possível carregar o status do motor.'),
      }));
    }
  }

  /* ---------- API pública ---------- */

  function definirMotores(ids: number[]) {
    const novos = ids.filter((id) => !estado.motores[id]);
    const mantidos: Record<number, MotorTelemetria> = {};
    for (const id of ids) mantidos[id] = estado.motores[id] ?? criarMotor(id);

    const removidos = Object.keys(estado.motores).some((id) => !ids.includes(Number(id)));
    if (novos.length === 0 && !removidos) return;

    for (const id of Object.keys(estado.motores).map(Number)) {
      if (!ids.includes(id)) {
        ultimaConsultaEm.delete(id);
        solicitacao.delete(id);
      }
    }
    definir({ ...estado, motores: mantidos });
    novos.forEach((id) => void carregarStatus(id));
  }

  function recarregarStatus(ids: number[]): Promise<void[]> {
    return Promise.all(ids.map((id) => carregarStatus(id)));
  }

  function recarregarTodos(): Promise<void[]> {
    return recarregarStatus(Object.keys(estado.motores).map(Number));
  }

  /**
   * Vigia de silêncio: o backend não avisa quando o ESP para. Motor sem lote
   * há mais de 30 s tem o status consultado, no máximo uma vez a cada 30 s.
   */
  function verificarSilencio() {
    const agora = deps.agora();
    for (const motor of Object.values(estado.motores)) {
      if (motor.carregando) continue;
      const idade = idadeEmSegundos(motor.ultimoLoteEm, agora);
      const silencioso = idade === null || idade > LIMITE_ATRASO_SEGUNDOS;
      if (!silencioso) continue;
      const ultima = ultimaConsultaEm.get(motor.motorId);
      if (ultima !== undefined && agora - ultima < INTERVALO_MINIMO_CONSULTA_MS) continue;
      void carregarStatus(motor.motorId);
    }
    // O hub desiste após as tentativas automáticas; a vigia tenta de novo.
    if (estado.conexao === 'desconectado') deps.hub?.iniciar();
  }

  function aoMudarConexao(conexao: StatusConexaoHub) {
    const anterior = estado.conexao;
    if (anterior !== conexao) definir({ ...estado, conexao });
    // O hub não reenvia eventos perdidos: ao conectar e ao reconectar, recarrega tudo.
    if (conexao === 'conectado' && anterior !== 'conectado') void recarregarTodos();
  }

  /** Liga hub e vigia. Contagem de referências: o último a sair desliga. */
  function iniciar(): () => void {
    usuarios += 1;
    if (usuarios === 1 && deps.hub) {
      descartar = [
        deps.hub.onLoteTelemetria(aplicarLote),
        deps.hub.onStatusMotor((status) => void aplicarStatus(status)),
        deps.hub.onStatusMudou(aoMudarConexao),
      ];
      deps.hub.iniciar();
      if (deps.agendarVigia !== false) timer = setInterval(verificarSilencio, INTERVALO_VIGIA_MS);
    }

    let ativo = true;
    return () => {
      if (!ativo) return;
      ativo = false;
      usuarios -= 1;
      if (usuarios === 0) {
        descartar.forEach((fn) => fn());
        descartar = [];
        if (timer) clearInterval(timer);
        timer = null;
      }
    };
  }

  return {
    subscribe(ouvinte: () => void) {
      ouvintes.add(ouvinte);
      return () => {
        ouvintes.delete(ouvinte);
      };
    },
    obterEstado: () => estado,
    obterMotor: (motorId: number): MotorTelemetria | undefined => estado.motores[motorId],
    obterConexao: (): StatusConexaoHub => estado.conexao,
    definirMotores,
    carregarStatus,
    recarregarStatus,
    recarregarTodos,
    verificarSilencio,
    aplicarLote,
    aplicarStatus,
    aoMudarConexao,
    iniciar,
  };
}

export type TelemetriaStore = ReturnType<typeof criarTelemetriaStore>;
