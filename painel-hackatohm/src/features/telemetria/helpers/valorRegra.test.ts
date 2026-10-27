import { describe, expect, it } from 'vitest';
import { mesclarLeitura, SERIE_VAZIA } from '../store/mesclagem';
import { SerieEscova } from '../store/tipos';
import { iso, leitura } from '../testing/fabricas';
import {
  escalaDaRegra,
  extremosDoLote,
  gradienteDaEscova,
  posicaoNaEscala,
  valorAtualDaRegra,
} from './valorRegra';

const serie = (numeroEscova: number, pares: Array<[number, number]>): SerieEscova =>
  pares.reduce(
    (s, [segundos, valor]) => mesclarLeitura(s, leitura({ numeroEscova, valorCelsius: valor, dataHora: iso(segundos) })).serie,
    SERIE_VAZIA
  );

describe('gradienteDaEscova', () => {
  it('calcula °C/min entre os dois últimos pontos', () => {
    expect(gradienteDaEscova(serie(1, [[0, 50], [30, 55]]))).toBeCloseTo(10);
  });

  it('nulo com menos de dois pontos', () => {
    expect(gradienteDaEscova(serie(1, [[0, 50]]))).toBeNull();
    expect(gradienteDaEscova(undefined)).toBeNull();
  });

  it('queda dá valor negativo (o cálculo não classifica)', () => {
    expect(gradienteDaEscova(serie(1, [[0, 60], [60, 58]]))).toBeCloseTo(-2);
  });
});

describe('extremosDoLote e valorAtualDaRegra', () => {
  const escovas = {
    1: serie(1, [[0, 50], [10, 52]]),
    2: serie(2, [[0, 60], [10, 70]]),
    3: serie(3, [[0, 49], [10, 44]]),
  };

  it('acha a escova mais quente e a mais fria', () => {
    const e = extremosDoLote(escovas)!;
    expect(e.maisQuente.numeroEscova).toBe(2);
    expect(e.maisFria.numeroEscova).toBe(3);
    expect(e.diferenca).toBe(26);
    expect(extremosDoLote({ 1: escovas[1] })).toBeNull();
  });

  it('valor atual por tipo de regra', () => {
    expect(valorAtualDaRegra('temperatura.limiar_estatico', escovas)).toBe(70);
    expect(valorAtualDaRegra('temperatura.assimetria_escovas', escovas)).toBe(26);
    expect(valorAtualDaRegra('temperatura.gradiente_termico', escovas)).toBeCloseTo(60);
    expect(valorAtualDaRegra('desconhecido', escovas)).toBeNull();
    expect(valorAtualDaRegra('temperatura.limiar_estatico', {})).toBeNull();
  });
});

describe('escalaDaRegra e posicaoNaEscala', () => {
  it('cobre até acima do limite crítico e começa em zero', () => {
    const escala = escalaDaRegra('temperatura.gradiente_termico', { aviso: 5, critico: 10 });
    expect(escala.min).toBe(0);
    expect(escala.max).toBeGreaterThan(10);
  });

  it('amplia para caber o valor atual', () => {
    const escala = escalaDaRegra('temperatura.limiar_estatico', { aviso: 80, critico: 95 }, 140);
    expect(escala.max).toBeGreaterThan(140);
  });

  it('limiar com limites negativos abre a escala abaixo de zero', () => {
    const escala = escalaDaRegra('temperatura.limiar_estatico', { aviso: -20, critico: -5 });
    expect(escala.min).toBeLessThan(-20);
  });

  it('limita a posição às bordas', () => {
    const escala = { min: 0, max: 100 };
    expect(posicaoNaEscala(50, escala)).toBe(50);
    expect(posicaoNaEscala(-10, escala)).toBe(0);
    expect(posicaoNaEscala(500, escala)).toBe(100);
  });
});
