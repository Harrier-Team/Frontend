import { describe, expect, it } from 'vitest';
import { PrevisaoDaEscova } from './previsao';
import { fimDoEixo, LIMITE_EXTENSAO_MS, limitesPrevistos, projetarPrevisao } from './projecao';

const T0 = Date.parse('2026-10-27T14:30:00+00:00');

function item(minutos: number, sobrescrever: Partial<PrevisaoDaEscova> = {}): PrevisaoDaEscova {
  return {
    numeroEscova: 2,
    severidade: 'AlertaPreditivo',
    dataHora: new Date(T0).toISOString(),
    previsao: { minutos, horizonte: 10, limiteC: 95, inclinacao: 2, amostras: 12 },
    ...sobrescrever,
  };
}

describe('projetarPrevisao', () => {
  it('deriva os pontos só de valores do backend', () => {
    const p = projetarPrevisao(item(8), T0)!;
    // Reta no lote: 95 - 2 x 8 = 79 °C; chega a 95 °C 8 min depois.
    expect(p.inicio).toEqual({ t: T0, v: 79 });
    expect(p.fim).toEqual({ t: T0 + 8 * 60_000, v: 95 });
    expect(p.truncada).toBe(false);
    expect(p.temSegmento).toBe(true);
  });

  it('corta a projeção em +30 min e mantém a inclinação', () => {
    const p = projetarPrevisao(item(50), T0)!;
    expect(p.truncada).toBe(true);
    expect(p.fim.t).toBe(T0 + LIMITE_EXTENSAO_MS);
    // Início 95 - 100 = -5 °C; depois de 30 min a 2 °C/min: 55 °C.
    expect(p.inicio.v).toBe(-5);
    expect(p.fim.v).toBe(55);
  });

  it('o teto é contado a partir do fim dos dados, não do lote', () => {
    const fimDados = T0 + 60_000;
    const p = projetarPrevisao(item(32), fimDados)!;
    expect(p.truncada).toBe(true);
    expect(p.fim.t).toBe(fimDados + LIMITE_EXTENSAO_MS);
  });

  it('com 0 minutos só há a linha do limite', () => {
    const p = projetarPrevisao(item(0), T0)!;
    expect(p.temSegmento).toBe(false);
    expect(p.inicio).toEqual({ t: T0, v: 95 });
  });

  it('horário inválido não projeta', () => {
    expect(projetarPrevisao(item(8, { dataHora: 'lixo' }), T0)).toBeNull();
  });
});

describe('fimDoEixo', () => {
  it('estende até o horário previsto e nunca além de +30 min', () => {
    expect(fimDoEixo(T0, [projetarPrevisao(item(8), T0)!])).toBe(T0 + 8 * 60_000);
    expect(fimDoEixo(T0, [projetarPrevisao(item(90), T0)!])).toBe(T0 + LIMITE_EXTENSAO_MS);
  });

  it('sem projeção, o eixo termina nos dados', () => {
    expect(fimDoEixo(T0, [])).toBe(T0);
  });
});

describe('limitesPrevistos', () => {
  it('uma linha por temperatura, na severidade mais grave', () => {
    const a = projetarPrevisao(item(8), T0)!;
    const b = projetarPrevisao(item(4, { numeroEscova: 3, severidade: 'Critico' }), T0)!;
    expect(limitesPrevistos([a, b])).toEqual([{ limiteC: 95, severidade: 'Critico' }]);
  });
});
