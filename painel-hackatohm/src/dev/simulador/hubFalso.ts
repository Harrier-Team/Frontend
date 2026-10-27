import type { HubTelemetria } from '@/features/telemetria/store/criarTelemetriaStore';
import type { StatusConexaoHub } from '@/features/telemetria/services/signalrService';
import type { LeituraEscova, MotorStatusDto } from '@/features/telemetria/types/telemetria';
import { CADENCIA_SIMULADA_MS } from './cenarios';
import type { LoteGerado, ServidorSimulado } from './servidor';

/**
 * Hub falso: entrega ao store os mesmos eventos do SignalR
 * (`ReceberLoteTelemetria` e `ReceberStatusMotor`) a cada ~3 s, mais o
 * histórico recente de cada motor logo depois que o store o conhece.
 */
export function criarHubFalso(servidor: ServidorSimulado, cadenciaMs: number = CADENCIA_SIMULADA_MS) {
  const lotes = new Set<(leituras: LeituraEscova[]) => void>();
  const status = new Set<(s: MotorStatusDto) => void>();
  const conexao = new Set<(s: StatusConexaoHub) => void>();
  const historicoEntregue = new Set<number>();
  let timer: ReturnType<typeof setInterval> | null = null;
  let atual: StatusConexaoHub = 'desconectado';

  const mudarConexao = (proximo: StatusConexaoHub) => {
    atual = proximo;
    conexao.forEach((cb) => cb(proximo));
  };

  const entregar = (lote: LoteGerado) => {
    lotes.forEach((cb) => cb(lote.leituras));
    status.forEach((cb) => cb(lote.status));
  };

  const hub: HubTelemetria & {
    /** Entrega o histórico recente do motor (uma vez), depois que o store o registrou. */
    entregarHistorico(motorId: number): void;
  } = {
    iniciar() {
      if (timer) return;
      setTimeout(() => mudarConexao('conectado'), 150);
      timer = setInterval(() => servidor.tick().forEach(entregar), cadenciaMs);
    },
    onLoteTelemetria(cb) {
      lotes.add(cb);
      return () => lotes.delete(cb);
    },
    onStatusMotor(cb) {
      status.add(cb);
      return () => status.delete(cb);
    },
    onStatusMudou(cb) {
      conexao.add(cb);
      cb(atual);
      return () => conexao.delete(cb);
    },
    entregarHistorico(motorId) {
      if (historicoEntregue.has(motorId)) return;
      historicoEntregue.add(motorId);
      // Fora do ciclo da resposta HTTP, quando o store já conhece o motor.
      setTimeout(() => {
        for (const lote of servidor.historico(motorId)) lotes.forEach((cb) => cb(lote.leituras));
      }, 0);
    },
  };
  return hub;
}

export type HubFalso = ReturnType<typeof criarHubFalso>;
