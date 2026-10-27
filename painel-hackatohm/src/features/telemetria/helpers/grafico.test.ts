import { describe, expect, it } from 'vitest';
import { PontoEscova } from '@/features/telemetria/store/tipos';
import {
  afastarRotulos,
  cadenciaMediana,
  calcularEscalaY,
  calcularTicksX,
  dividirEmSegmentos,
  dividirPorSeveridade,
  loteProximo,
  marcadoresDeTransicao,
  montarLotes,
  pontosSparkline,
  recortarJanela,
  reduzirPontos,
} from './grafico';

const p = (t: number, v: number, severidade: PontoEscova['severidade'] = 'Normal'): PontoEscova => ({
  t: t * 1000,
  v,
  severidade,
});

describe('cadenciaMediana', () => {
  it('usa a cadência de referência sem pontos suficientes', () => {
    expect(cadenciaMediana([])).toBe(10_000);
    expect(cadenciaMediana([p(0, 1)])).toBe(10_000);
  });

  it('usa a mediana, ignorando uma lacuna isolada', () => {
    const pontos = [p(0, 1), p(10, 1), p(20, 1), p(30, 1), p(200, 1)];
    expect(cadenciaMediana(pontos)).toBe(10_000);
  });
});

describe('dividirEmSegmentos', () => {
  it('quebra a linha quando o intervalo passa de 3x a cadência', () => {
    const pontos = [p(0, 1), p(10, 1), p(20, 1), p(60, 1), p(70, 1)];
    const segmentos = dividirEmSegmentos(pontos, 10_000);
    expect(segmentos.map((s) => s.length)).toEqual([3, 2]);
  });

  it('não quebra no limite exato de 3x', () => {
    const segmentos = dividirEmSegmentos([p(0, 1), p(30, 1)], 10_000);
    expect(segmentos).toHaveLength(1);
  });

  it('série vazia não gera segmentos', () => {
    expect(dividirEmSegmentos([])).toEqual([]);
  });
});

describe('recortarJanela', () => {
  it('mantém só os pontos da janela', () => {
    const pontos = [p(0, 1), p(100, 2), p(200, 3)];
    expect(recortarJanela(pontos, 50_000, 200_000).map((x) => x.v)).toEqual([2, 3]);
  });
});

describe('reduzirPontos', () => {
  it('não altera séries pequenas', () => {
    const pontos = Array.from({ length: 10 }, (_, i) => p(i, i));
    expect(reduzirPontos(pontos, 50)).toBe(pontos);
  });

  it('preserva picos, vales, extremidades e pontos de alerta', () => {
    const pontos = Array.from({ length: 400 }, (_, i) => p(i, 50 + Math.sin(i / 7)));
    pontos[123] = p(123, 140);
    pontos[250] = p(250, -10);
    pontos[301] = p(301, 51, 'AlertaPreditivo');
    const reduzidos = reduzirPontos(pontos, 60);

    expect(reduzidos.length).toBeLessThan(pontos.length);
    expect(reduzidos.length).toBeLessThanOrEqual(130);
    expect(reduzidos[0]).toBe(pontos[0]);
    expect(reduzidos[reduzidos.length - 1]).toBe(pontos[399]);
    expect(reduzidos).toContain(pontos[123]);
    expect(reduzidos).toContain(pontos[250]);
    expect(reduzidos).toContain(pontos[301]);
    const ts = reduzidos.map((x) => x.t);
    expect([...ts].sort((a, b) => a - b)).toEqual(ts);
  });
});

describe('calcularEscalaY', () => {
  it('dá 5 °C de margem acima do maior valor ou do limite crítico', () => {
    const semLimite = calcularEscalaY([40, 72]);
    expect(semLimite.max).toBeGreaterThanOrEqual(77);
    expect(semLimite.min).toBeLessThanOrEqual(35);

    const comLimite = calcularEscalaY([40, 72], 95);
    expect(comLimite.max).toBeGreaterThanOrEqual(100);
  });

  it('gera marcas dentro da escala e sem dados enquadra um intervalo útil', () => {
    const vazia = calcularEscalaY([], null);
    expect(vazia.max - vazia.min).toBeGreaterThan(0);
    const escala = calcularEscalaY([60, 61]);
    expect(escala.max - escala.min).toBeGreaterThanOrEqual(20);
    expect(escala.ticks[0]).toBe(escala.min);
    expect(escala.ticks[escala.ticks.length - 1]).toBe(escala.max);
  });
});

describe('calcularTicksX', () => {
  it('alinha as marcas a passos redondos e respeita o alvo', () => {
    const ticks = calcularTicksX(0, 300_000, 6);
    expect(ticks.length).toBeLessThanOrEqual(7);
    expect(ticks.every((t) => t % 60_000 === 0)).toBe(true);
  });

  it('intervalo inválido não gera marcas', () => {
    expect(calcularTicksX(10, 10, 5)).toEqual([]);
  });
});

describe('montarLotes e loteProximo', () => {
  const series = [
    { numeroEscova: 1, pontos: [p(0, 50), p(10, 52), p(20, 55)] },
    { numeroEscova: 2, pontos: [p(0, 51), p(10, 70), p(20, 96, 'Critico')] },
  ];

  it('agrupa por instante e calcula o ΔT do lote', () => {
    const lotes = montarLotes(series);
    expect(lotes).toHaveLength(3);
    expect(lotes[1].deltaT).toBe(18);
    expect(lotes[2].valores[2].severidade).toBe('Critico');
  });

  it('ΔT é nulo com uma só escova', () => {
    expect(montarLotes([series[0]])[0].deltaT).toBeNull();
  });

  it('encontra o lote mais próximo', () => {
    const lotes = montarLotes(series);
    expect(loteProximo(lotes, 4_000)).toBe(0);
    expect(loteProximo(lotes, 6_000)).toBe(1);
    expect(loteProximo(lotes, 99_000)).toBe(2);
    expect(loteProximo([], 1)).toBe(-1);
  });
});

describe('marcadoresDeTransicao', () => {
  it('marca só a entrada em severidade anormal ou mais grave', () => {
    const pontos = [
      p(0, 70, 'Normal'),
      p(1, 80, 'AlertaPreditivo'),
      p(2, 81, 'AlertaPreditivo'),
      p(3, 96, 'Critico'),
      p(4, 97, 'Critico'),
      p(5, 90, 'AlertaPreditivo'),
      p(6, 50, 'Normal'),
      p(7, 82, 'AlertaPreditivo'),
    ];
    expect(marcadoresDeTransicao(pontos).map((m) => m.t / 1000)).toEqual([1, 3, 7]);
  });

  it('série que já começa em alerta marca o primeiro ponto e ignora Normal e sem severidade', () => {
    expect(marcadoresDeTransicao([p(0, 90, 'Critico'), p(1, 91, 'Critico')]).map((m) => m.t)).toEqual([0]);
    expect(marcadoresDeTransicao([p(0, 50, null), p(1, 51, 'Normal')])).toEqual([]);
  });
});

describe('dividirPorSeveridade', () => {
  it('colore o trecho que chega ao ponto anormal e mantém a linha contínua', () => {
    const pontos = [p(0, 70), p(1, 80, 'AlertaPreditivo'), p(2, 81, 'AlertaPreditivo'), p(3, 60), p(4, 61)];
    const trechos = dividirPorSeveridade(pontos);
    expect(trechos.map((t) => t.severidade)).toEqual(['AlertaPreditivo', null]);
    expect(trechos.map((t) => t.pontos.length)).toEqual([3, 3]);
    expect(trechos[0].pontos[2]).toBe(trechos[1].pontos[0]);
  });

  it('um ponto só vira um trecho neutro', () => {
    expect(dividirPorSeveridade([p(0, 70)])).toHaveLength(1);
    expect(dividirPorSeveridade([])).toEqual([]);
  });
});

describe('pontosSparkline', () => {
  it('fica dentro da caixa e termina no último valor', () => {
    const pontos = pontosSparkline([50, 52, 70, 60], 80, 24, 3);
    expect(pontos).toHaveLength(4);
    for (const ponto of pontos) {
      expect(ponto.x).toBeGreaterThanOrEqual(3);
      expect(ponto.x).toBeLessThanOrEqual(77);
      expect(ponto.y).toBeGreaterThanOrEqual(3);
      expect(ponto.y).toBeLessThanOrEqual(21);
    }
    expect(pontos[3].x).toBe(77);
  });

  it('série plana fica no meio e série vazia não desenha', () => {
    const plana = pontosSparkline([50, 50, 50], 80, 24, 3);
    expect(new Set(plana.map((p) => p.y)).size).toBe(1);
    expect(plana[0].y).toBeCloseTo(12);
    expect(pontosSparkline([], 80, 24, 3)).toEqual([]);
  });
});

describe('afastarRotulos', () => {
  it('separa rótulos sobrepostos mantendo a ordem', () => {
    const ys = afastarRotulos([100, 102, 101, 300], 14, 0, 400);
    const ordenado = [...ys].sort((a, b) => a - b);
    for (let i = 1; i < ordenado.length; i += 1) {
      expect(ordenado[i] - ordenado[i - 1]).toBeGreaterThanOrEqual(14 - 1e-9);
    }
    expect(ys[3]).toBe(300);
    expect(ys[0]).toBeLessThan(ys[2]);
    expect(ys[2]).toBeLessThan(ys[1]);
  });

  it('respeita os limites verticais', () => {
    const ys = afastarRotulos([1, 2], 14, 0, 400);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
    const baixo = afastarRotulos([399, 400], 14, 0, 400);
    expect(Math.max(...baixo)).toBeLessThanOrEqual(400);
  });
});
