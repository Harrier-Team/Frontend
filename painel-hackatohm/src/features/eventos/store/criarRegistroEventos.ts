import { EstadoTelemetria, MotorTelemetria } from '@/features/telemetria/store/tipos';
import type { StatusConexaoHub } from '@/features/telemetria/services/signalrService';
import {
  acumularEventos,
  detectarConexao,
  detectarTransicoes,
  EventoSessao,
  NovoEvento,
  snapshotDoMotor,
  SnapshotMotor,
} from '../helpers/transicoes';

export const LIMITE_EVENTOS = 500;

export interface EstadoEventos {
  /** Mais recente primeiro, no máximo `LIMITE_EVENTOS`. */
  eventos: EventoSessao[];
}

export interface FonteTelemetria {
  subscribe(ouvinte: () => void): () => void;
  obterEstado(): EstadoTelemetria;
}

/**
 * Registro em memória da conexão na sessão, derivado do store de telemetria:
 * situação de cada motor (Online, Degradado, Offline) e quedas do hub. O
 * primeiro retrato de cada motor é só a linha de base: carregar a página não
 * gera evento. Severidade não é registrada aqui; vem dos alertas do servidor.
 */
export function criarRegistroEventos(fonte: FonteTelemetria, agora: () => number, limite = LIMITE_EVENTOS) {
  let estado: EstadoEventos = { eventos: [] };
  let proximoId = 1;
  const ouvintes = new Set<() => void>();
  const retratos = new Map<number, SnapshotMotor>();
  const vistos = new Map<number, MotorTelemetria>();
  let conexaoAnterior: StatusConexaoHub | null = null;
  let houveQueda = false;
  let usuarios = 0;
  let descartar: (() => void) | null = null;

  function processar() {
    const { motores, conexao } = fonte.obterEstado();
    for (const id of [...retratos.keys()]) {
      if (!motores[id]) {
        retratos.delete(id);
        vistos.delete(id);
      }
    }

    const brutos: NovoEvento[] = [];

    const resultado = detectarConexao(conexaoAnterior, conexao, houveQueda, agora());
    conexaoAnterior = conexao;
    houveQueda = resultado.houveQueda;
    if (resultado.evento) brutos.push(resultado.evento);

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
      brutos.push(...detectarTransicoes(motor.motorId, antes, depois, em));
    }
    if (brutos.length === 0) return;

    const novos = brutos.map((bruto) => ({ ...bruto, id: proximoId++ }));
    estado = { eventos: acumularEventos(estado.eventos, novos, limite) };
    ouvintes.forEach((ouvinte) => ouvinte());
  }

  return {
    subscribe(ouvinte: () => void) {
      ouvintes.add(ouvinte);
      return () => {
        ouvintes.delete(ouvinte);
      };
    },
    obterEstado: () => estado,
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
