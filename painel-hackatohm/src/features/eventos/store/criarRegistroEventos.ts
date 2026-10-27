import { EstadoTelemetria, MotorTelemetria } from '@/features/telemetria/store/tipos';
import {
  acumularEventos,
  detectarTransicoes,
  EventoSessao,
  snapshotDoMotor,
  SnapshotMotor,
} from '../helpers/transicoes';

export const LIMITE_EVENTOS = 500;

export interface EstadoEventos {
  /** Mais recente primeiro, no máximo `LIMITE_EVENTOS`. */
  eventos: EventoSessao[];
  /** Eventos com `id` até este valor já foram vistos. */
  vistoAte: number;
}

export interface FonteTelemetria {
  subscribe(ouvinte: () => void): () => void;
  obterEstado(): EstadoTelemetria;
}

/**
 * Registro em memória das transições da sessão, derivado do store de
 * telemetria (status do hub, lotes e consultas). O primeiro retrato de cada
 * motor é só a linha de base: carregar a página não gera evento.
 */
export function criarRegistroEventos(fonte: FonteTelemetria, agora: () => number, limite = LIMITE_EVENTOS) {
  let estado: EstadoEventos = { eventos: [], vistoAte: 0 };
  let proximoId = 1;
  const ouvintes = new Set<() => void>();
  const ouvintesNovos = new Set<(novos: EventoSessao[]) => void>();
  const retratos = new Map<number, SnapshotMotor>();
  const vistos = new Map<number, MotorTelemetria>();
  let usuarios = 0;
  let descartar: (() => void) | null = null;

  function processar() {
    const motores = fonte.obterEstado().motores;
    for (const id of [...retratos.keys()]) {
      if (!motores[id]) {
        retratos.delete(id);
        vistos.delete(id);
      }
    }

    const novos: EventoSessao[] = [];
    for (const motor of Object.values(motores)) {
      if (vistos.get(motor.motorId) === motor) continue;
      vistos.set(motor.motorId, motor);
      // Sem resposta do status ainda: não há linha de base confiável.
      if (!motor.carregado) continue;

      const em = agora();
      const depois = snapshotDoMotor(motor, em);
      const antes = retratos.get(motor.motorId);
      retratos.set(motor.motorId, depois);
      if (!antes) continue;

      for (const bruto of detectarTransicoes(motor.motorId, antes, depois, em)) {
        novos.push({ ...bruto, id: proximoId++ });
      }
    }
    if (novos.length === 0) return;

    estado = { ...estado, eventos: acumularEventos(estado.eventos, novos, limite) };
    ouvintes.forEach((ouvinte) => ouvinte());
    ouvintesNovos.forEach((ouvinte) => ouvinte(novos));
  }

  return {
    subscribe(ouvinte: () => void) {
      ouvintes.add(ouvinte);
      return () => {
        ouvintes.delete(ouvinte);
      };
    },
    obterEstado: () => estado,
    /** Chamado a cada rodada de transições novas (toast, título da aba). */
    aoNovosEventos(ouvinte: (novos: EventoSessao[]) => void) {
      ouvintesNovos.add(ouvinte);
      return () => {
        ouvintesNovos.delete(ouvinte);
      };
    },
    marcarComoVisto() {
      const ultimo = proximoId - 1;
      if (estado.vistoAte === ultimo) return;
      estado = { ...estado, vistoAte: ultimo };
      ouvintes.forEach((ouvinte) => ouvinte());
    },
    /** Passa a observar o store de telemetria. Contagem de referências. */
    iniciar(): () => void {
      usuarios += 1;
      if (usuarios === 1) {
        processar();
        descartar = fonte.subscribe(processar);
      }
      let ativo = true;
      return () => {
        if (!ativo) return;
        ativo = false;
        usuarios -= 1;
        if (usuarios === 0) {
          descartar?.();
          descartar = null;
        }
      };
    },
  };
}

export type RegistroEventos = ReturnType<typeof criarRegistroEventos>;
