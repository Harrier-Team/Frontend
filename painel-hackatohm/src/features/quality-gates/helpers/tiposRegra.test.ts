import { describe, expect, it } from 'vitest';
import {
  agruparRegrasPorTipo,
  agruparTiposPorCategoria,
  descreverFaixa,
  descreverLimites,
  ehPrevisao,
  ehRegraEditavel,
  formatarValorELimite,
  formatarValorGate,
  LISTA_TIPOS_REGRA,
  nomeRegraDistinto,
  obterTipoRegra,
} from './tiposRegra';

describe('formatarValorGate', () => {
  it('usa a unidade do tipo da regra', () => {
    expect(formatarValorGate('temperatura.limiar_estatico', 96.1)).toBe('96,1 °C');
    expect(formatarValorGate('temperatura.gradiente_termico', 6.2)).toBe('6,2 °C/min');
    expect(formatarValorGate('temperatura.assimetria_escovas', 25.2)).toBe('25,2 °C');
  });

  it('valor observado tem sempre uma casa decimal', () => {
    expect(formatarValorGate('temperatura.limiar_estatico', 98.34)).toBe('98,3 °C');
    expect(formatarValorGate('temperatura.assimetria_escovas', 35.49)).toBe('35,5 °C');
    expect(formatarValorGate('temperatura.limiar_estatico', 95)).toBe('95,0 °C');
  });

  it('limite dispensa o ",0" e preserva até duas casas configuradas', () => {
    expect(formatarValorGate('temperatura.limiar_estatico', 95, 'limite')).toBe('95 °C');
    expect(formatarValorGate('temperatura.limiar_estatico', 82.5, 'limite')).toBe('82,5 °C');
    expect(formatarValorGate('temperatura.gradiente_termico', 6.25, 'limite')).toBe('6,25 °C/min');
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
  it('tem quatro tipos com nome amigável e o técnico como subtítulo', () => {
    expect(LISTA_TIPOS_REGRA.map((t) => [t.rotulo, t.subtitulo])).toEqual([
      ['Limite de temperatura', 'Limiar estático'],
      ['Velocidade de aquecimento', 'Gradiente térmico'],
      ['Diferença entre escovas', 'Assimetria entre escovas'],
      ['Tempo até o limite', 'Previsão por tendência'],
    ]);
  });

  it('o tipo de previsão é preditivo, em minutos, e ehPrevisao o reconhece', () => {
    const info = obterTipoRegra('temperatura.previsao_tendencia');
    expect(info.conhecido).toBe(true);
    expect(info.categoria).toBe('Preditivo');
    expect(info.unidade).toBe('min');
    expect(info.aguardaQuando).toBe('Nas primeiras 5 leituras de cada escova.');
    expect(ehPrevisao('temperatura.previsao_tendencia')).toBe(true);
    expect(ehPrevisao('temperatura.limiar_estatico')).toBe(false);
    expect(ehPrevisao(undefined)).toBe(false);
    expect(ehRegraEditavel({ tipoRegra: 'temperatura.previsao_tendencia' })).toBe(true);
  });

  it('o seletor agrupa pela categoria do backend', () => {
    expect(agruparTiposPorCategoria().map((g) => [g.rotulo, g.tipos.map((t) => t.rotulo)])).toEqual([
      ['Preditivo', ['Tempo até o limite']],
      ['Aceleração', ['Velocidade de aquecimento']],
      ['Condição', ['Limite de temperatura', 'Diferença entre escovas']],
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

describe('previsão por tendência: formatação', () => {
  it('o observado é uma estimativa em minutos e o limite é o horizonte', () => {
    expect(formatarValorGate('temperatura.previsao_tendencia', 8.4)).toBe('~8 min');
    expect(formatarValorGate('temperatura.previsao_tendencia', 80)).toBe('~1 h 20 min');
    expect(formatarValorGate('temperatura.previsao_tendencia', 0)).toBe('agora');
    expect(formatarValorGate('temperatura.previsao_tendencia', 10, 'limite')).toBe('10 min');
  });

  it('valor e limite não usam o sinal de maior ou igual na previsão', () => {
    expect(formatarValorELimite('temperatura.previsao_tendencia', 8.4, 10)).toBe('~8 min · horizonte 10 min');
    expect(formatarValorELimite('temperatura.limiar_estatico', 96.1, 95)).toBe('96,1 °C ≥ 95 °C');
    expect(formatarValorELimite('outro.tipo', 12, 10)).toBe('12 ≥ 10');
  });

  it('descreve a antecedência da regra', () => {
    expect(
      descreverLimites('temperatura.previsao_tendencia', { aviso: 30, critico: 10, temperaturaLimite: 95 })
    ).toBe('Avisa 30 min antes de 95 °C; crítico 10 min antes');
  });

  it('descreve a faixa em minutos', () => {
    expect(descreverFaixa(obterTipoRegra('temperatura.previsao_tendencia'))).toBe('em minutos, maiores que zero');
  });

  it('agrupa a previsão antes dos demais, pela ordem das categorias', () => {
    const grupos = agruparRegrasPorTipo([
      { tipoRegra: 'temperatura.limiar_estatico', nome: 'A' },
      { tipoRegra: 'temperatura.previsao_tendencia', nome: 'P' },
      { tipoRegra: 'temperatura.gradiente_termico', nome: 'G' },
    ]);
    expect(grupos.map((g) => g.info.tipo)).toEqual([
      'temperatura.previsao_tendencia',
      'temperatura.gradiente_termico',
      'temperatura.limiar_estatico',
    ]);
  });
});
