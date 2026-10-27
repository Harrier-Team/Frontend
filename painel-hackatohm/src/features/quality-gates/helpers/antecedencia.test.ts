import { describe, expect, it } from 'vitest';
import { fraseDaAntecedencia, posicoesNaRegua, traduzirJanela } from './antecedencia';

describe('régua de antecedência', () => {
  it('agora fica à direita: o crítico está mais à direita que o aviso', () => {
    const posicoes = posicoesNaRegua(30, 10)!;
    expect(posicoes.aviso).toBeGreaterThan(0);
    expect(posicoes.critico).toBeGreaterThan(posicoes.aviso);
    expect(posicoes.critico).toBeLessThan(100);
  });

  it('valores fora da ordem invertida não têm régua', () => {
    expect(posicoesNaRegua(10, 30)).toBeNull();
    expect(posicoesNaRegua(10, 10)).toBeNull();
    expect(posicoesNaRegua(30, 0)).toBeNull();
    expect(posicoesNaRegua(Number.NaN, 5)).toBeNull();
  });

  it('monta a frase da regra', () => {
    expect(fraseDaAntecedencia(30, 10, 95)).toBe('Avisa 30 min antes de 95 °C; crítico 10 min antes');
    expect(fraseDaAntecedencia(90, 10, undefined)).toBe(
      'Avisa 1 h 30 min antes de a temperatura limite; crítico 10 min antes'
    );
    expect(fraseDaAntecedencia(5, 10, 95)).toBeNull();
  });

  it('traduz a janela em histórico', () => {
    expect(traduzirJanela(12)).toBe('≈ 2 min de histórico a cada 10 s');
    expect(traduzirJanela(5)).toBe('≈ 0,8 min de histórico a cada 10 s');
  });
});
