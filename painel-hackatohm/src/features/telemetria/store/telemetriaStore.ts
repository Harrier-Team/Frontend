import { motorService } from '@/features/motores/services/motorService';
import { signalRService } from '@/features/telemetria/services/signalrService';
import { criarTelemetriaStore, HubTelemetria, TelemetriaStore } from './criarTelemetriaStore';

let hubAtivo: HubTelemetria = signalRService;

/**
 * Troca a fonte de eventos do painel antes de a aplicação iniciar. Usado só
 * pelo simulador de desenvolvimento; em produção o hub é sempre o SignalR.
 */
export function definirHubTelemetria(hub: HubTelemetria): void {
  hubAtivo = hub;
}

/** Repassa ao hub vigente: a troca acontece antes de o store iniciar (`iniciar`). */
const hubDelegado: HubTelemetria = {
  iniciar: () => hubAtivo.iniciar(),
  onLoteTelemetria: (cb) => hubAtivo.onLoteTelemetria(cb),
  onStatusMotor: (cb) => hubAtivo.onStatusMotor(cb),
  onStatusMudou: (cb) => hubAtivo.onStatusMudou(cb),
};

/** Instância única do painel. Os testes usam `criarTelemetriaStore` com dependências falsas. */
export const telemetriaStore: TelemetriaStore = criarTelemetriaStore({
  obterStatus: (motorId) => motorService.obterStatus(motorId),
  agora: () => Date.now(),
  hub: hubDelegado,
});
