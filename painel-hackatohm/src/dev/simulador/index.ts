import { api } from '@/services/api';
import { definirHubTelemetria } from '@/features/telemetria/store/telemetriaStore';
import { criarAdaptador } from './adaptador';
import { criarHubFalso } from './hubFalso';
import { criarServidorSimulado } from './servidor';

/**
 * Liga o simulador: troca o transporte HTTP do axios e a fonte de eventos do
 * store. Nenhum componente sabe que está em simulação.
 */
export function instalarSimulador(): void {
  // VITE_SIMULADOR_CADENCIA_S muda o intervalo entre lotes (padrão 3 s; o ESP real envia a cada ~10 s).
  const segundos = Number(import.meta.env.VITE_SIMULADOR_CADENCIA_S);
  const cadenciaMs = Number.isFinite(segundos) && segundos >= 1 ? Math.round(segundos * 1000) : undefined;
  const servidor = criarServidorSimulado(Date.now, cadenciaMs);
  const hub = criarHubFalso(servidor, cadenciaMs);
  api.defaults.adapter = criarAdaptador(servidor, hub);
  definirHubTelemetria(hub);
}
