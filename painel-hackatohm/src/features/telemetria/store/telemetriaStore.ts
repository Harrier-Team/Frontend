import { motorService } from '@/features/motores/services/motorService';
import { signalRService } from '@/features/telemetria/services/signalrService';
import { criarTelemetriaStore, TelemetriaStore } from './criarTelemetriaStore';

/** Instância única do painel. Os testes usam `criarTelemetriaStore` com dependências falsas. */
export const telemetriaStore: TelemetriaStore = criarTelemetriaStore({
  obterStatus: (motorId) => motorService.obterStatus(motorId),
  agora: () => Date.now(),
  hub: signalRService,
});
