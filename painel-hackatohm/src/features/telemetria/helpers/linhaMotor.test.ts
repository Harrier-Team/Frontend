import { describe, expect, it } from 'vitest';
import { mesclarLeitura, SERIE_VAZIA } from '../store/mesclagem';
import { MotorTelemetria, SerieEscova } from '../store/tipos';
import { gate, gateAlerta, iso, leitura } from '../testing/fabricas';
import {
  contarPorFiltro,
  deltaTDasUltimas,
  descreverMotivo,
  filtroDoEstado,
  motivoDoMotor,
  serieDaMaiorTemperatura,
} from './linhaMotor';

function serie(...leituras: Parameters<typeof leitura>[0][]): SerieEscova {
  return leituras.reduce((s, l) => mesclarLeitura(s, leitura(l)).serie, SERIE_VAZIA);
}

describe('filtros da visão geral', () => {
  it('agrupa estados sem severidade em sem-dados e sem-avaliacao', () => {
    expect(filtroDoEstado('offline')).toBe('sem-dados');
    expect(filtroDoEstado('degradado')).toBe('sem-dados');
    expect(filtroDoEstado('sem-leitura')).toBe('sem-dados');
    expect(filtroDoEstado('aguardando-amostras')).toBe('sem-avaliacao');
    expect(filtroDoEstado('sem-regras')).toBe('sem-avaliacao');
    expect(filtroDoEstado('Critico')).toBe('Critico');
  });

  it('conta por filtro', () => {
    const c = contarPorFiltro(['Critico', 'Normal', 'Normal', 'offline', 'sem-regras']);
    expect(c).toMatchObject({ todos: 5, Critico: 1, Normal: 2, 'sem-dados': 1, 'sem-avaliacao': 1 });
  });
});

describe('serieDaMaiorTemperatura e deltaTDasUltimas', () => {
  const escovas = {
    1: serie({ numeroEscova: 1, valorCelsius: 50, dataHora: iso(0) }, { numeroEscova: 1, valorCelsius: 52, dataHora: iso(10) }),
    2: serie({ numeroEscova: 2, valorCelsius: 60, dataHora: iso(0) }, { numeroEscova: 2, valorCelsius: 58, dataHora: iso(10) }),
  };

  it('usa a maior temperatura de cada lote', () => {
    expect(serieDaMaiorTemperatura(escovas)).toEqual([60, 58]);
  });

  it('limita a quantidade de lotes', () => {
    expect(serieDaMaiorTemperatura(escovas, 1)).toEqual([58]);
    expect(serieDaMaiorTemperatura(undefined)).toEqual([]);
  });

  it('calcula ΔT das últimas leituras, nulo com uma escova', () => {
    expect(deltaTDasUltimas(escovas)).toBe(6);
    expect(deltaTDasUltimas({ 1: escovas[1] })).toBeNull();
  });
});

describe('motivoDoMotor e descreverMotivo', () => {
  const telemetria = (escovas: MotorTelemetria['escovas']) =>
    ({ escovas }) as unknown as MotorTelemetria;

  it('prefere o motivo do status do backend', () => {
    const motivo = {
      numeroEscova: 2,
      nomeRegra: 'Limiar estático',
      tipoRegra: 'temperatura.limiar_estatico',
      codigoRegra: 'TEMP_CRITICA',
      valorObservado: 96.1,
      valorLimite: 95,
      mensagemDiagnostico: null,
    };
    expect(motivoDoMotor(undefined, motivo)).toBe(motivo);
  });

  it('sem status, usa o gate mais grave das leituras, sem olhar temperatura', () => {
    const escovas = {
      1: serie({ numeroEscova: 1, valorCelsius: 190, resultadosQualityGates: [gate()] }),
      2: serie({ numeroEscova: 2, valorCelsius: 30, resultadosQualityGates: [gateAlerta('AlertaPreditivo')] }),
      3: serie({ numeroEscova: 3, resultadosQualityGates: [gateAlerta('Critico')] }),
    };
    expect(motivoDoMotor(telemetria(escovas), null)?.numeroEscova).toBe(3);
    expect(motivoDoMotor(telemetria({ 1: escovas[1] }), null)).toBeNull();
  });

  it('descreve o quê, onde e quanto na unidade da regra', () => {
    const base = {
      numeroEscova: 2,
      nomeRegra: 'x',
      codigoRegra: 'x',
      mensagemDiagnostico: null,
    };
    expect(
      descreverMotivo(
        { ...base, tipoRegra: 'temperatura.limiar_estatico', valorObservado: 96.1, valorLimite: 95 },
        'Motor A'
      )
    ).toBe('Escova 2 de Motor A: limiar estático, 96,1 °C ≥ 95 °C');
    expect(
      descreverMotivo(
        { ...base, tipoRegra: 'temperatura.gradiente_termico', valorObservado: 6.2, valorLimite: 5 },
        'Motor A'
      )
    ).toContain('6,2 °C/min ≥ 5 °C/min');
    expect(
      descreverMotivo(
        { ...base, tipoRegra: 'temperatura.assimetria_escovas', valorObservado: 25.2, valorLimite: 15 },
        'Motor A'
      )
    ).toBe('Motor A: assimetria entre escovas, 25,2 °C ≥ 15 °C');
  });
});
