import { beforeEach, describe, expect, it, vi } from 'vitest';
import { leituraService } from './leituraService';
import { classificarSensor } from '../helpers/statusHelper';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/services/api', () => ({ api: { get } }));

const aviso = {
  regraQualidadeId: 'regra-1', nomeRegra: 'Temperatura',
  severidade: 'AlertaPreditivo', disparouAlerta: true,
  tipoRegra: 'temperatura.limiar_estatico', codigoRegra: 'TEMPERATURA_ALERTA',
  mensagemDiagnostico: 'Temperatura na faixa de aviso',
  valorObservado: 85, valorLimite: 80, metadados: null,
};
const leitura = {
  sensorId: 'AA:BB:CC:DD:EE:FF_Escova1', valorCelsius: 85,
  dataHora: '2026-10-26T12:00:00Z', alertaDesgaste: true,
};

describe('leituraService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('preserva os gates do GET para que o aviso continue atenção após recarregar', async () => {
    get.mockResolvedValue({ data: { ...leitura, resultadosQualityGates: [aviso] } });
    const result = await leituraService.obterUltimaLeitura('aa:bb:cc:dd:ee:ff', 1);
    expect(result?.resultadosQualityGates).toEqual([aviso]);
    expect(classificarSensor(result?.valorCelsius, true, result?.resultadosQualityGates)).toBe('warning');
    expect(get).toHaveBeenCalledWith('/leituras', {
      params: { espMacAddress: 'AA:BB:CC:DD:EE:FF', numeroEscova: 1 },
    });
  });

  it.each([undefined, null, []])('normaliza gates ausentes para uma lista: %j', async (gates) => {
    get.mockResolvedValue({ data: { ...leitura, resultadosQualityGates: gates } });
    const result = await leituraService.obterUltimaLeitura('AA:BB', 1);
    expect(result?.resultadosQualityGates).toEqual([]);
    expect(classificarSensor(result?.valorCelsius, true, result?.resultadosQualityGates)).toBe('sem_avaliacao');
  });

  it.each([3, 'Critico'])('preserva o crítico recebido pelo GET como %s', async (severidade) => {
    get.mockResolvedValue({
      data: { ...leitura, resultadosQualityGates: [{ ...aviso, severidade }] },
    });
    const result = await leituraService.obterUltimaLeitura('AA:BB', 1);
    expect(result?.resultadosQualityGates[0].severidade).toBe('Critico');
    expect(classificarSensor(result?.valorCelsius, true, result?.resultadosQualityGates)).toBe('perigo');
  });
});
