import { RANK_SEVERIDADE } from '@/features/telemetria/helpers/estadoHelper';
import type { StatusConexaoHub } from '@/features/telemetria/services/signalrService';
import { MotorStatusDto } from '@/features/telemetria/types/telemetria';
import { ApiRequestError } from '@/types/api';
import { obterMensagemErro } from '@/utils/errorHelper';
import { ordenarAlertas } from '../helpers/apresentacao';
import { AlertaManutencao } from '../types/alerta';

/** Intervalo de espera antes de recarregar a lista depois de um status de motor com alerta aberto. */
export const ESPERA_RECARGA_MS = 2000;

export type SituacaoAlertas = 'inicial' | 'carregando' | 'pronto' | 'erro' | 'indisponivel';

export interface EstadoAlertas {
  /** Alertas em aberto, mais graves primeiro. */
  abertos: AlertaManutencao[];
  situacao: SituacaoAlertas;
  /** Mensagem amigável da última falha (sem ser 404). */
  erro: string | null;
}

export type MotivoAviso = 'aberto' | 'subiu';

/** Eventos do hub que o store de alertas usa. */
export interface HubAlertas {
  onAlertaManutencao(callback: (alerta: AlertaManutencao) => void): () => void;
  onStatusMotor(callback: (status: MotorStatusDto) => void): () => void;
  onStatusMudou(callback: (status: StatusConexaoHub) => void): () => void;
}

export interface DependenciasAlertas {
  listarAbertos(): Promise<AlertaManutencao[]>;
  hub: HubAlertas | null;
  /** Agenda `fn` e devolve o cancelamento. Em testes, controlado à mão. */
  agendar?: (fn: () => void, ms: number) => () => void;
  /** Avisa quando o usuário volta para a aba ou a janela; devolve a função que desliga. */
  aoVoltarFoco?: (callback: () => void) => () => void;
}

const agendarPadrao = (fn: () => void, ms: number) => {
  const timer = setTimeout(fn, ms);
  return () => clearTimeout(timer);
};

function porId(lista: Iterable<AlertaManutencao>): Map<number, AlertaManutencao> {
  return new Map([...lista].map((alerta) => [alerta.id, alerta]));
}

/**
 * Store dos alertas em aberto. O backend publica `ReceberAlertaManutencao` só
 * quando um alerta abre ou sobe de severidade: encerramento e queda de
 * severidade não geram evento. Por isso a lista é recarregada:
 *  - ao iniciar e ao conectar ou reconectar o hub;
 *  - depois de um `ReceberStatusMotor` de motor com alerta aberto (espera de 2 s);
 *  - quando o usuário volta o foco para a aba.
 * O evento insere ou atualiza pelo `id`, sem duplicar. Um 404 significa
 * backend sem a funcionalidade: o store fica `indisponivel` e para de insistir.
 */
export function criarAlertasStore(deps: DependenciasAlertas) {
  const agendar = deps.agendar ?? agendarPadrao;
  let estado: EstadoAlertas = { abertos: [], situacao: 'inicial', erro: null };
  let mapa = new Map<number, AlertaManutencao>();
  const ouvintes = new Set<() => void>();
  const ouvintesAviso = new Set<(alerta: AlertaManutencao, motivo: MotivoAviso) => void>();

  let emCarga: Promise<void> | null = null;
  let recarregarDepois = false;
  // Alertas que chegaram pelo hub durante uma consulta: a resposta pode ser mais antiga que eles.
  let chegaramDuranteCarga = new Set<number>();
  let cancelarEspera: (() => void) | null = null;
  let conexaoAnterior: StatusConexaoHub | null = null;
  let usuarios = 0;
  let descartar: Array<() => void> = [];

  function definir(parcial: Partial<EstadoAlertas>, novoMapa?: Map<number, AlertaManutencao>) {
    if (novoMapa) {
      mapa = novoMapa;
      estado = { ...estado, ...parcial, abertos: ordenarAlertas([...mapa.values()]) };
    } else {
      estado = { ...estado, ...parcial };
    }
    ouvintes.forEach((ouvinte) => ouvinte());
  }

  async function executarCarga() {
    chegaramDuranteCarga = new Set();
    if (estado.situacao !== 'pronto') definir({ situacao: 'carregando', erro: null });
    try {
      const lista = await deps.listarAbertos();
      const novo = porId(lista.filter((alerta) => alerta.ativo));
      for (const id of chegaramDuranteCarga) {
        const local = mapa.get(id);
        if (local && !novo.has(id)) novo.set(id, local);
      }
      definir({ situacao: 'pronto', erro: null }, novo);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 404) {
        // Backend sem a funcionalidade: nada a mostrar nem a tentar de novo.
        definir({ situacao: 'indisponivel', erro: null }, new Map());
        return;
      }
      // Falha de rede: a lista que já temos continua valendo, marcada com o erro.
      definir({
        situacao: 'erro',
        erro: obterMensagemErro(error, 'Não foi possível carregar os alertas.'),
      });
    }
  }

  /** Recarrega a lista. Consultas simultâneas viram uma só (mais uma ao final, se pediram no meio). */
  function carregar(forcar = false): Promise<void> {
    if (estado.situacao === 'indisponivel' && !forcar) return Promise.resolve();
    if (emCarga) {
      recarregarDepois = true;
      return emCarga;
    }
    emCarga = executarCarga().finally(() => {
      emCarga = null;
      if (recarregarDepois) {
        recarregarDepois = false;
        void carregar();
      }
    });
    return emCarga;
  }

  /** Aplica o evento do hub: insere ou atualiza pelo `id`. Avisa só se o alerta é novo ou subiu. */
  function aplicarAlerta(alerta: AlertaManutencao) {
    if (!alerta.ativo) {
      if (!mapa.has(alerta.id)) return;
      const restante = new Map(mapa);
      restante.delete(alerta.id);
      definir({}, restante);
      return;
    }
    const atual = mapa.get(alerta.id);
    // Evento atrasado: já temos uma versão mais recente.
    if (atual && Date.parse(atual.atualizadoEm) > Date.parse(alerta.atualizadoEm)) return;

    const novo = new Map(mapa);
    novo.set(alerta.id, alerta);
    if (emCarga) chegaramDuranteCarga.add(alerta.id);
    definir({}, novo);

    const motivo: MotivoAviso | null = !atual
      ? 'aberto'
      : RANK_SEVERIDADE[alerta.severidade] > RANK_SEVERIDADE[atual.severidade]
        ? 'subiu'
        : null;
    if (motivo) ouvintesAviso.forEach((ouvinte) => ouvinte(alerta, motivo));
  }

  function aoStatusDoMotor(status: MotorStatusDto) {
    if (cancelarEspera || estado.situacao === 'indisponivel') return;
    if (![...mapa.values()].some((alerta) => alerta.motorId === status.motorId)) return;
    cancelarEspera = agendar(() => {
      cancelarEspera = null;
      void carregar();
    }, ESPERA_RECARGA_MS);
  }

  function aoMudarConexao(conexao: StatusConexaoHub) {
    const anterior = conexaoAnterior;
    conexaoAnterior = conexao;
    // O hub não reenvia o que se perdeu: ao conectar e ao reconectar, recarrega.
    if (conexao === 'conectado' && anterior !== 'conectado') void carregar();
  }

  return {
    subscribe(ouvinte: () => void) {
      ouvintes.add(ouvinte);
      return () => {
        ouvintes.delete(ouvinte);
      };
    },
    obterEstado: () => estado,
    /** Chamado a cada alerta novo ou que subiu de severidade (toast). */
    aoNovoAlerta(ouvinte: (alerta: AlertaManutencao, motivo: MotivoAviso) => void) {
      ouvintesAviso.add(ouvinte);
      return () => {
        ouvintesAviso.delete(ouvinte);
      };
    },
    carregar,
    /** "Tentar de novo": ignora o estado indisponível. */
    recarregar: () => carregar(true),
    aplicarAlerta,
    aoStatusDoMotor,
    aoMudarConexao,
    /** Liga o hub e o foco. Contagem de referências: o último a sair desliga. */
    iniciar(): () => void {
      usuarios += 1;
      if (usuarios === 1) {
        descartar = [];
        if (deps.hub) {
          descartar.push(
            deps.hub.onAlertaManutencao(aplicarAlerta),
            deps.hub.onStatusMotor(aoStatusDoMotor),
            deps.hub.onStatusMudou(aoMudarConexao)
          );
        }
        if (deps.aoVoltarFoco) descartar.push(deps.aoVoltarFoco(() => void carregar()));
        void carregar();
      }
      let ativo = true;
      return () => {
        if (!ativo) return;
        ativo = false;
        usuarios -= 1;
        if (usuarios === 0) {
          descartar.forEach((fn) => fn());
          descartar = [];
          cancelarEspera?.();
          cancelarEspera = null;
          conexaoAnterior = null;
        }
      };
    },
  };
}

export type AlertasStore = ReturnType<typeof criarAlertasStore>;
