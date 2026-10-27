import { describe, expect, it } from 'vitest';
import {
  descreverLimites,
  formatarValorGate,
  LISTA_TIPOS_REGRA,
  obterTipoRegra,
} from './tiposRegra';

describe('formatarValorGate', () => {
  it('usa a unidade do tipo da regra', () => {
    expect(formatarValorGate('temperatura.limiar_estatico', 96.1)).toBe('96,1 °C');
    expect(formatarValorGate('temperatura.gradiente_termico', 6.25)).toBe('6,25 °C/min');
    expect(formatarValorGate('temperatura.assimetria_escovas', 25.2)).toBe('25,2 °C');
  });

  it('não acrescenta unidade a tipos desconhecidos', () => {
    expect(formatarValorGate('outro.tipo', 12)).toBe('12');
  });

  it('mostra traço para valores ausentes', () => {
    expect(formatarValorGate('temperatura.limiar_estatico', null)).toBe('—');
    expect(formatarValorGate('temperatura.limiar_estatico', undefined)).toBe('—');
    expect(formatarValorGate('temperatura.limiar_estatico', Number.NaN)).toBe('—');
  });

  it('descreve os limites com a unidade correta', () => {
    expect(descreverLimites('temperatura.gradiente_termico', { aviso: 5, critico: 10 })).toBe(
      'Aviso em 5 °C/min, crítico em 10 °C/min'
    );
  });
});

describe('catálogo de tipos', () => {
  it('tem três tipos com limites padrão válidos', () => {
    expect(LISTA_TIPOS_REGRA).toHaveLength(3);
    for (const tipo of LISTA_TIPOS_REGRA) {
      expect(tipo.padrao.aviso).toBeLessThan(tipo.padrao.critico);
    }
  });

  it('cai no limiar estático para tipo desconhecido', () => {
    expect(obterTipoRegra('x').tipo).toBe('temperatura.limiar_estatico');
  });
});
