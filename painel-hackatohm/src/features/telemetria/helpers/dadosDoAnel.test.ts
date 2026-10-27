import { describe, expect, it } from 'vitest';
import { MotorTelemetria } from '../store/tipos';
import { gate, iso, leitura } from '../testing/fabricas';
import { dadosDoAnel } from './dadosDoAnel';

const previsao = gate({
  tipoRegra: 'temperatura.previsao_tendencia',
  nomeRegra: 'Tempo até o limite',
  disparouAlerta: true,
  severidade: 'AlertaPreditivo',
  codigoRegra: 'PREVISAO_TENDENCIA_ALERTA',
  valorObservado: 8.4,
  valorLimite: 10,
  metadados: { inclinacaoCelsiusPorMinuto: 2.1, temperaturaLimite: 95, amostras: 12 },
});

describe('dadosDoAnel: previsão', () => {
  it('marca só a escova com previsão ativa, com os minutos do backend', () => {
    const telemetria = {
      escovas: {
        1: { ultima: leitura({ numeroEscova: 1, dataHora: iso(0) }), pontos: [] },
        2: { ultima: leitura({ numeroEscova: 2, dataHora: iso(0), resultadosQualityGates: [previsao] }), pontos: [] },
      },
    } as unknown as MotorTelemetria;
    const { escovas } = dadosDoAnel([1, 2], telemetria);
    expect(escovas.map((e) => [e.numeroEscova, e.previsaoMinutos])).toEqual([
      [1, null],
      [2, 8.4],
    ]);
    expect(escovas[1].estado).toBe('AlertaPreditivo');
  });

  it('sem telemetria, ninguém tem previsão', () => {
    expect(dadosDoAnel([1], undefined).escovas[0].previsaoMinutos).toBeNull();
  });
});
