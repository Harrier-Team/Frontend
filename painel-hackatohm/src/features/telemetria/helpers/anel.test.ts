import { describe, expect, it } from 'vitest';
import { arcoMaisCurto, escovaVizinha, pontoNoAnel, posicoesDasEscovas } from './anel';

const perto = (a: number, b: number) => expect(a).toBeCloseTo(b, 6);

describe('pontoNoAnel', () => {
  it('0° é o topo e os ângulos crescem no sentido horário', () => {
    const topo = pontoNoAnel(100, 100, 50, 0);
    perto(topo.x, 100);
    perto(topo.y, 50);
    const direita = pontoNoAnel(100, 100, 50, 90);
    perto(direita.x, 150);
    perto(direita.y, 100);
    const baixo = pontoNoAnel(100, 100, 50, 180);
    perto(baixo.y, 150);
  });
});

describe('posicoesDasEscovas', () => {
  it('escova 1 no topo e as demais igualmente espaçadas, no sentido horário', () => {
    const pos = posicoesDasEscovas([3, 1, 2], 180, 180, 100);
    expect(pos.map((p) => p.numeroEscova)).toEqual([1, 2, 3]);
    expect(pos.map((p) => p.angulo)).toEqual([0, 120, 240]);
    perto(pos[0].x, 180);
    perto(pos[0].y, 80);
    expect(pos[1].x).toBeGreaterThan(180);
    expect(pos[2].x).toBeLessThan(180);
  });

  it('usa a ordem, não o valor, quando os números têm lacuna, e ignora repetidos', () => {
    const pos = posicoesDasEscovas([1, 4, 4], 0, 0, 10);
    expect(pos.map((p) => p.angulo)).toEqual([0, 180]);
  });

  it('sem escovas, sem posições', () => {
    expect(posicoesDasEscovas([], 0, 0, 10)).toEqual([]);
  });
});

describe('arcoMaisCurto (realce da assimetria)', () => {
  it('termina exatamente nas posições das duas escovas', () => {
    const pos = posicoesDasEscovas([1, 2, 3, 4], 180, 180, 100);
    const arco = arcoMaisCurto(180, 180, 100, pos[0].angulo, pos[1].angulo);
    perto(arco.inicio.x, pos[0].x);
    perto(arco.inicio.y, pos[0].y);
    perto(arco.fim.x, pos[1].x);
    perto(arco.fim.y, pos[1].y);
    expect(arco.abertura).toBe(90);
    expect(arco.horario).toBe(true);
    expect(arco.d).toMatch(/^M[\d.]+ [\d.]+ A100 100 0 0 1 /);
  });

  it('escolhe o caminho mais curto, inclusive passando pelo topo', () => {
    const arco = arcoMaisCurto(180, 180, 100, 270, 30);
    expect(arco.abertura).toBe(120);
    expect(arco.horario).toBe(true);
    const contrario = arcoMaisCurto(180, 180, 100, 30, 270);
    expect(contrario.abertura).toBe(120);
    expect(contrario.horario).toBe(false);
    expect(contrario.d).toContain(' 0 0 0 ');
  });

  it('em 180° vai no sentido horário', () => {
    const arco = arcoMaisCurto(0, 0, 10, 0, 180);
    expect(arco.abertura).toBe(180);
    expect(arco.horario).toBe(true);
  });
});

describe('escovaVizinha', () => {
  it('percorre na ordem, com volta nas pontas', () => {
    expect(escovaVizinha([2, 1, 3], 1, 1)).toBe(2);
    expect(escovaVizinha([2, 1, 3], 3, 1)).toBe(1);
    expect(escovaVizinha([2, 1, 3], 1, -1)).toBe(3);
  });

  it('sem seleção começa pela primeira (ou pela última, voltando)', () => {
    expect(escovaVizinha([2, 1], null, 1)).toBe(1);
    expect(escovaVizinha([2, 1], null, -1)).toBe(2);
    expect(escovaVizinha([], null, 1)).toBeNull();
  });
});
