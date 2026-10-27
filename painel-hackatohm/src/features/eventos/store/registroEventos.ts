import { telemetriaStore } from '@/features/telemetria/store/telemetriaStore';
import { criarRegistroEventos } from './criarRegistroEventos';

/** Instância única do painel. Os testes usam `criarRegistroEventos` com dependências falsas. */
export const registroEventos = criarRegistroEventos(telemetriaStore, () => Date.now());
