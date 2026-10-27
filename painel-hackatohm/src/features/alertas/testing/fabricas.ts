import { AlertaManutencao } from '../types/alerta';

export const INICIO = '2026-10-27T14:30:00+00:00';

/** Alerta de previsão em aberto, como o contrato do backend o descreve. */
export function alerta(sobrescrever: Partial<AlertaManutencao> = {}): AlertaManutencao {
  return {
    id: 41,
    motorId: 3,
    sensorId: 'AA:BB:CC:DD:EE:FF_Escova2',
    numeroEscova: 2,
    regraQualidadeId: '5f0c2b1e-8d4a-4a53-9a58-1f6f0a7c9e12',
    nomeRegra: 'Previsão por tendência',
    tipoRegra: 'temperatura.previsao_tendencia',
    categoria: 'Preditivo',
    codigoRegra: 'PREVISAO_TENDENCIA_ALERTA',
    severidade: 'AlertaPreditivo',
    valorObservado: 8.4,
    valorLimite: 10,
    mensagem: 'A escova 2 tende a atingir 95.0 °C em ~8 min (+2.10 °C/min).',
    iniciadoEm: INICIO,
    atualizadoEm: INICIO,
    resolvidoEm: null,
    ativo: true,
    ...sobrescrever,
  };
}

/** Alerta de limiar estático crítico. */
export function alertaCritico(sobrescrever: Partial<AlertaManutencao> = {}): AlertaManutencao {
  return alerta({
    id: 42,
    tipoRegra: 'temperatura.limiar_estatico',
    nomeRegra: 'Limiar estático',
    categoria: 'Condicao',
    codigoRegra: 'TEMP_CRITICA',
    severidade: 'Critico',
    valorObservado: 96.1,
    valorLimite: 95,
    mensagem: 'Escova 2 atingiu 96.1 °C.',
    ...sobrescrever,
  });
}
