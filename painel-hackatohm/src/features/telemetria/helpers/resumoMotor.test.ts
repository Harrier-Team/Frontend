import { describe, expect, it } from 'vitest';
import { resumirEscova, resumirMotor } from './resumoMotor';
import { escalaDoGauge } from './apresentacao';
import { MotorTelemetria } from '../store/tipos';
import { mesclarLeitura, SERIE_VAZIA } from '../store/mesclagem';
import { gate, gateAguardando, gateAlerta, iso, leitura, status, T0 } from '../testing/fabricas';
import { LeituraEscova } from '../types/telemetria';

function motor(
  leituras: LeituraEscova[],
  extras: Partial<MotorTelemetria> = {}
): MotorTelemetria {
  const escovas: MotorTelemetria['escovas'] = {};
  let ultimoLoteEm: string | null = null;
  for (const l of leituras) {
    escovas[l.numeroEscova] = mesclarLeitura(escovas[l.numeroEscova] ?? SERIE_VAZIA, l).serie;
    if (!ultimoLoteEm || Date.parse(l.dataHora) > Date.parse(ultimoLoteEm)) ultimoLoteEm = l.dataHora;
  }
  return {
    motorId: 1,
    status: null,
    statusVersao: null,
    statusAtualizadoEm: null,
    escovas,
    ultimoLoteEm,
    lotesNaSessao: 0,
    carregando: false,
    carregado: true,
    erro: null,
    ...extras,
  };
}

describe('resumirEscova', () => {
  it('sem leitura não tem severidade', () => {
    expect(resumirEscova(undefined)).toEqual({ severidade: null, avaliacao: 'sem-leitura' });
  });

  it('temperatura alta sem gate disparado continua Normal: o cliente não reclassifica', () => {
    const serie = mesclarLeitura(
      SERIE_VAZIA,
      leitura({ valorCelsius: 190, alertaDesgaste: false, resultadosQualityGates: [gate()] })
    ).serie;
    expect(resumirEscova(serie).severidade).toBe('Normal');
  });

  it('alertaDesgaste sozinho não define severidade', () => {
    const serie = mesclarLeitura(
      SERIE_VAZIA,
      leitura({ valorCelsius: 20, alertaDesgaste: true, resultadosQualityGates: [gate()] })
    ).serie;
    expect(resumirEscova(serie).severidade).toBe('Normal');
  });

  it('AlertaPreditivo vem do gate, não vira Crítico', () => {
    const serie = mesclarLeitura(
      SERIE_VAZIA,
      leitura({ alertaDesgaste: true, resultadosQualityGates: [gateAlerta('AlertaPreditivo')] })
    ).serie;
    expect(resumirEscova(serie).severidade).toBe('AlertaPreditivo');
  });

  it('só DADOS_INSUFICIENTES aguarda amostras e não é Normal', () => {
    const serie = mesclarLeitura(
      SERIE_VAZIA,
      leitura({ resultadosQualityGates: [gateAguardando()] })
    ).serie;
    expect(resumirEscova(serie)).toEqual({ severidade: null, avaliacao: 'aguardando-amostras' });
  });

  it('lista vazia é "sem regras"', () => {
    const serie = mesclarLeitura(SERIE_VAZIA, leitura({ resultadosQualityGates: [] })).serie;
    expect(resumirEscova(serie)).toEqual({ severidade: null, avaliacao: 'sem-regras' });
  });
});

describe('resumirMotor', () => {
  it('motor desconhecido ou sem leitura', () => {
    expect(resumirMotor(undefined, T0).principal).toBe('sem-leitura');
    expect(resumirMotor(motor([]), T0).principal).toBe('sem-leitura');
  });

  it('usa a severidadeGeral do status agregado', () => {
    const tel = motor(
      [leitura({ resultadosQualityGates: [gate()] })],
      { status: status({ severidadeGeral: 'AlertaPreditivo' }), statusVersao: T0 }
    );
    const resumo = resumirMotor(tel, T0 + 5_000);
    expect(resumo.severidade).toBe('AlertaPreditivo');
    expect(resumo.principal).toBe('AlertaPreditivo');
    expect(resumo.dado).toBe('ao-vivo');
  });

  it('calcula o máximo local enquanto o status ainda não chegou', () => {
    const tel = motor([
      leitura({ numeroEscova: 1, resultadosQualityGates: [gate()] }),
      leitura({ numeroEscova: 2, resultadosQualityGates: [gateAlerta('Critico')] }),
    ]);
    expect(resumirMotor(tel, T0).severidade).toBe('Critico');
  });

  it('ignora o status quando um lote mais novo já chegou', () => {
    const tel = motor(
      [leitura({ dataHora: iso(10), resultadosQualityGates: [gateAlerta('Critico')] })],
      { status: status({ severidadeGeral: 'Normal', situacao: 'Offline' }), statusVersao: T0 }
    );
    const resumo = resumirMotor(tel, T0 + 11_000);
    expect(resumo.severidade).toBe('Critico');
    expect(resumo.situacao).toBeNull();
    expect(resumo.dado).toBe('ao-vivo');
  });

  it('Normal sem avaliação concluída não é normalidade', () => {
    const aguardando = motor(
      [leitura({ resultadosQualityGates: [gateAguardando()] })],
      { status: status({ severidadeGeral: 'Normal' }), statusVersao: T0 }
    );
    expect(resumirMotor(aguardando, T0).principal).toBe('aguardando-amostras');

    const semRegras = motor(
      [leitura({ resultadosQualityGates: [] })],
      { status: status({ severidadeGeral: 'Normal' }), statusVersao: T0 }
    );
    expect(resumirMotor(semRegras, T0).principal).toBe('sem-regras');
  });

  it('silêncio não é normalidade: crítico sem lote continua crítico e desatualizado', () => {
    const tel = motor(
      [leitura({ resultadosQualityGates: [gateAlerta('Critico')] })],
      { status: status({ severidadeGeral: 'Critico', situacao: 'Online' }), statusVersao: T0 }
    );
    const resumo = resumirMotor(tel, T0 + 60_000);
    expect(resumo.principal).toBe('Critico');
    expect(resumo.dado).toBe('atrasado');
  });

  it('Offline do backend sem severidade anormal vira offline', () => {
    const tel = motor(
      [leitura({ resultadosQualityGates: [gate()] })],
      { status: status({ severidadeGeral: 'Normal', situacao: 'Offline' }), statusVersao: T0 }
    );
    expect(resumirMotor(tel, T0 + 130_000).principal).toBe('offline');
  });

  it('calcula a temperatura máxima das últimas leituras', () => {
    const tel = motor([
      leitura({ numeroEscova: 1, valorCelsius: 40 }),
      leitura({ numeroEscova: 2, valorCelsius: 61.5 }),
    ]);
    expect(resumirMotor(tel, T0).temperaturaMaxima).toBe(61.5);
  });
});

describe('escalaDoGauge', () => {
  it('sem limites usa só o enquadramento 0 a 100 °C, ampliado se o valor sair dele', () => {
    expect(escalaDoGauge(null, 50)).toEqual({ min: 0, max: 100 });
    expect(escalaDoGauge(undefined, 120)).toEqual({ min: 0, max: 120 });
  });

  it('com limites acompanha o crítico da regra', () => {
    expect(escalaDoGauge({ aviso: 80, critico: 95 }, 70)).toEqual({ min: 0, max: 110 });
  });

  it('comporta limites negativos', () => {
    const escala = escalaDoGauge({ aviso: -20, critico: -5 }, -10);
    expect(escala.min).toBeLessThanOrEqual(-30);
    expect(escala.max).toBeGreaterThan(0);
  });
});

describe('resumirEscova e assimetria', () => {
  it('a assimetria repetida pelo backend não torna a escova crítica', () => {
    const serie = mesclarLeitura(
      SERIE_VAZIA,
      leitura({
        resultadosQualityGates: [
          gate(),
          gateAlerta('Critico', { tipoRegra: 'temperatura.assimetria_escovas', regraQualidadeId: 'assim' }),
        ],
      })
    ).serie;
    expect(resumirEscova(serie).severidade).toBe('Normal');
  });
});
