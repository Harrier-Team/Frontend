import { describe, expect, it } from 'vitest';
import { gate, gateAguardando, iso, leitura } from '../testing/fabricas';
import { MotorTelemetria } from '../store/tipos';
import { fraseCompletaPrevisao, fraseCurtaPrevisao, lerPrevisao, previsoesDoMotor } from './previsao';

const gatePrevisao = (sobrescrever = {}) =>
  gate({
    tipoRegra: 'temperatura.previsao_tendencia',
    nomeRegra: 'Tempo até o limite',
    disparouAlerta: true,
    severidade: 'AlertaPreditivo',
    codigoRegra: 'PREVISAO_TENDENCIA_ALERTA',
    valorObservado: 8.4,
    valorLimite: 10,
    metadados: { inclinacaoCelsiusPorMinuto: 2.1, temperaturaLimite: 95, amostras: 12 },
    ...sobrescrever,
  });

describe('lerPrevisao', () => {
  it('lê minutos, horizonte e metadados do backend', () => {
    expect(lerPrevisao(gatePrevisao())).toEqual({
      minutos: 8.4,
      horizonte: 10,
      limiteC: 95,
      inclinacao: 2.1,
      amostras: 12,
    });
  });

  it('zero minutos é uma previsão válida ("agora")', () => {
    expect(lerPrevisao(gatePrevisao({ valorObservado: 0 }))?.minutos).toBe(0);
  });

  it('metadados ausentes ou inválidos devolvem null', () => {
    expect(lerPrevisao(gatePrevisao({ metadados: null }))).toBeNull();
    expect(lerPrevisao(gatePrevisao({ metadados: {} }))).toBeNull();
    expect(
      lerPrevisao(gatePrevisao({ metadados: { inclinacaoCelsiusPorMinuto: 'x', temperaturaLimite: 95 } }))
    ).toBeNull();
    expect(
      lerPrevisao(gatePrevisao({ metadados: { inclinacaoCelsiusPorMinuto: 2, temperaturaLimite: null } }))
    ).toBeNull();
    expect(
      lerPrevisao(gatePrevisao({ metadados: { inclinacaoCelsiusPorMinuto: -1, temperaturaLimite: 95 } }))
    ).toBeNull();
  });

  it('sem estimativa (Normal, aguardando, outro tipo) devolve null', () => {
    expect(
      lerPrevisao(gatePrevisao({ valorObservado: null, valorLimite: null, severidade: 'Normal', metadados: null }))
    ).toBeNull();
    expect(lerPrevisao(gatePrevisao({ valorObservado: Number.NaN }))).toBeNull();
    expect(lerPrevisao(gatePrevisao({ valorObservado: -3 }))).toBeNull();
    expect(
      lerPrevisao(gateAguardando({ tipoRegra: 'temperatura.previsao_tendencia', nomeRegra: 'Tempo até o limite' }))
    ).toBeNull();
    expect(
      lerPrevisao(gate({ valorObservado: 5, metadados: { inclinacaoCelsiusPorMinuto: 1, temperaturaLimite: 9 } }))
    ).toBeNull();
  });

  it('horizonte e amostras ausentes viram null sem invalidar a previsão', () => {
    const p = lerPrevisao(
      gatePrevisao({ valorLimite: null, metadados: { inclinacaoCelsiusPorMinuto: 2, temperaturaLimite: 95 } })
    );
    expect(p).toMatchObject({ horizonte: null, amostras: null });
  });
});

function escovasCom(primeira: ReturnType<typeof gate>, segunda: ReturnType<typeof gate>): MotorTelemetria['escovas'] {
  return {
    1: { ultima: leitura({ numeroEscova: 1, dataHora: iso(0), resultadosQualityGates: [primeira] }), pontos: [] },
    2: { ultima: leitura({ numeroEscova: 2, dataHora: iso(0), resultadosQualityGates: [segunda] }), pontos: [] },
  };
}

describe('previsoesDoMotor', () => {
  it('ordena pela menor espera e ignora quem não disparou', () => {
    const lista = previsoesDoMotor(
      escovasCom(gatePrevisao({ valorObservado: 20 }), gatePrevisao({ valorObservado: 4, severidade: 'Critico' }))
    );
    expect(lista.map((p) => [p.numeroEscova, p.previsao.minutos, p.severidade])).toEqual([
      [2, 4, 'Critico'],
      [1, 20, 'AlertaPreditivo'],
    ]);
    expect(previsoesDoMotor(escovasCom(gate(), gate()))).toEqual([]);
    expect(previsoesDoMotor(undefined)).toEqual([]);
  });
});

describe('frases da previsão', () => {
  it('frase curta do modo TV e da linha do motor', () => {
    expect(fraseCurtaPrevisao(2, { minutos: 8.4, limiteC: 95 })).toBe('Escova 2 → 95 °C em ~8 min');
    expect(fraseCurtaPrevisao(2, { minutos: 0, limiteC: 95 })).toBe('Escova 2 → 95 °C agora');
    expect(fraseCurtaPrevisao(null, { minutos: 8.4, limiteC: 95 })).toBe('95 °C em ~8 min');
  });

  it('frase completa com horário previsto, inclinação e leituras', () => {
    const item = {
      numeroEscova: 2,
      previsao: { minutos: 8.4, horizonte: 10, limiteC: 95, inclinacao: 2.1, amostras: 12 },
      severidade: 'AlertaPreditivo' as const,
      dataHora: '2026-10-27T14:30:00+00:00',
    };
    expect(fraseCompletaPrevisao(item, 'UTC')).toBe(
      'Escova 2 deve atingir 95 °C às ≈ 14:38 (~8 min) · subindo 2,1 °C/min · 12 leituras'
    );
    expect(fraseCompletaPrevisao({ ...item, previsao: { ...item.previsao, minutos: 0 } }, 'UTC')).toContain(
      '95 °C agora'
    );
  });
});
