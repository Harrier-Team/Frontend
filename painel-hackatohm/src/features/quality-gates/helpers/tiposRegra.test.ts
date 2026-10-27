import { describe, expect, it } from 'vitest';
import {
  agruparRegrasPorTipo,
  descreverFaixa,
  descreverLimites,
  ehRegraEditavel,
  formatarValorGate,
  LISTA_TIPOS_REGRA,
  nomeRegraDistinto,
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
  it('tem três tipos com nome amigável e o técnico como subtítulo', () => {
    expect(LISTA_TIPOS_REGRA.map((t) => [t.rotulo, t.subtitulo])).toEqual([
      ['Limite de temperatura', 'Limiar estático'],
      ['Velocidade de aquecimento', 'Gradiente térmico'],
      ['Diferença entre escovas', 'Assimetria entre escovas'],
    ]);
  });

  it('tipo desconhecido aparece pelo identificador, sem unidade e sem edição', () => {
    const info = obterTipoRegra('outro.tipo');
    expect(info.conhecido).toBe(false);
    expect(info.rotulo).toBe('outro.tipo');
    expect(info.unidade).toBe('');
    expect(ehRegraEditavel({ tipoRegra: 'outro.tipo' })).toBe(false);
    expect(ehRegraEditavel({ tipoRegra: 'temperatura.limiar_estatico' })).toBe(true);
    expect(descreverLimites('outro.tipo', { aviso: 1, critico: 2 })).toBe('Aviso em 1, crítico em 2');
  });
});

describe('descreverFaixa', () => {
  it('descreve a faixa por tipo', () => {
    expect(descreverFaixa(obterTipoRegra('temperatura.limiar_estatico'))).toBe('de -55 a 200 °C');
    expect(descreverFaixa(obterTipoRegra('temperatura.gradiente_termico'))).toBe('0 ou mais °C/min');
  });
});

describe('agruparRegrasPorTipo', () => {
  it('agrupa na ordem do catálogo, ordena por nome e omite grupos vazios', () => {
    const grupos = agruparRegrasPorTipo([
      { tipoRegra: 'temperatura.assimetria_escovas', nome: 'Z' },
      { tipoRegra: 'temperatura.limiar_estatico', nome: 'b' },
      { tipoRegra: 'temperatura.limiar_estatico', nome: 'A' },
    ]);
    expect(grupos.map((g) => g.info.tipo)).toEqual([
      'temperatura.limiar_estatico',
      'temperatura.assimetria_escovas',
    ]);
    expect(grupos[0].regras.map((r) => r.nome)).toEqual(['A', 'b']);
  });
});

describe('agruparRegrasPorTipo com tipo desconhecido', () => {
  it('separa o desconhecido pelo identificador, depois dos conhecidos', () => {
    const grupos = agruparRegrasPorTipo([
      { tipoRegra: 'x.y', nome: 'Z' },
      { tipoRegra: 'temperatura.limiar_estatico', nome: 'A' },
    ]);
    expect(grupos.map((g) => g.info.tipo)).toEqual(['temperatura.limiar_estatico', 'x.y']);
    expect(grupos[1].info.conhecido).toBe(false);
  });
});

describe('nomeRegraDistinto', () => {
  const info = obterTipoRegra('temperatura.assimetria_escovas');
  it('omite o nome que só repete o tipo (rótulo ou nome técnico)', () => {
    expect(nomeRegraDistinto('Assimetria entre escovas', info)).toBeNull();
    expect(nomeRegraDistinto(' diferença entre escovas ', info)).toBeNull();
    expect(nomeRegraDistinto('', info)).toBeNull();
  });
  it('mantém nomes próprios', () => {
    expect(nomeRegraDistinto('Assimetria rígida', info)).toBe('Assimetria rígida');
  });
});
