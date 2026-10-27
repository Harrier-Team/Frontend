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
  const servidor = criarServidorSimulado();
  const hub = criarHubFalso(servidor);
  api.defaults.adapter = criarAdaptador(servidor, hub);
  definirHubTelemetria(hub);
}
