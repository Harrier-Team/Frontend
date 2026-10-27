import { describe, expect, it } from 'vitest';
import { RegraQualidade } from '@/features/quality-gates/types/regraQualidade';
import { AmostraSimulada, avaliarLote, avaliarPrevisao } from './avaliador';

const regra = (parametros: Partial<RegraQualidade['parametros']> = {}): RegraQualidade => ({
  id: 'r1',
  nome: 'Tempo até o limite',
  descricao: null,
  tipoRegra: 'temperatura.previsao_tendencia',
  severidadePadrao: 'AlertaPreditivo',
  parametros: { aviso: 30, critico: 10, temperaturaLimite: 95, ...parametros },
  ativo: true,
  criadoEm: '2026-10-27T14:00:00Z',
});

const T0 = Date.parse('2026-10-27T14:30:00Z');

/** `n` amostras a cada 10 s, subindo `porMinuto` °C/min, a última com `final` °C. */
function subindo(n: number, porMinuto: number, final: number): AmostraSimulada[] {
  return Array.from({ length: n }, (_, i) => ({
    numeroEscova: 2,
    t: T0 - (n - 1 - i) * 10_000,
    valor: final - ((n - 1 - i) * 10 * porMinuto) / 60,
  }));
}

describe('avaliarPrevisao (mínimos quadrados, como o backend)', () => {
  it('estima os minutos até o limite pela inclinação', () => {
    // 80 °C subindo 3 °C/min: faltam 15 °C = 5 min.
    const amostras = subindo(8, 3, 80);
    const resultado = avaliarPrevisao(regra({ aviso: 10, critico: 3 }), amostras[amostras.length - 1], amostras.slice(0, -1));
    expect(resultado.severidade).toBe('AlertaPreditivo');
    expect(resultado.codigoRegra).toBe('PREVISAO_TENDENCIA_ALERTA');
    expect(resultado.valorObservado).toBeCloseTo(5, 5);
    expect(resultado.valorLimite).toBe(10);
    expect(resultado.metadados).toMatchObject({ temperaturaLimite: 95, amostras: 8 });
    expect((resultado.metadados as { inclinacaoCelsiusPorMinuto: number }).inclinacaoCelsiusPorMinuto).toBeCloseTo(3, 5);
  });

  it('crítico quando faltam no máximo os minutos do crítico; o limite é o horizonte atingido', () => {
    const amostras = subindo(8, 3, 80);
    const resultado = avaliarPrevisao(regra({ aviso: 30, critico: 10 }), amostras[7], amostras.slice(0, 7));
    expect(resultado.severidade).toBe('Critico');
    expect(resultado.codigoRegra).toBe('PREVISAO_TENDENCIA_CRITICA');
    expect(resultado.valorLimite).toBe(10);
  });

  it('já passou do limite: 0 minutos', () => {
    const amostras = subindo(8, 3, 99);
    expect(avaliarPrevisao(regra(), amostras[7], amostras.slice(0, 7)).valorObservado).toBe(0);
  });

  it('menos de 5 leituras aguarda amostras', () => {
    const amostras = subindo(4, 3, 80);
    const resultado = avaliarPrevisao(regra(), amostras[3], amostras.slice(0, 3));
    expect(resultado.codigoRegra).toBe('DADOS_INSUFICIENTES');
    expect(resultado.metadados).toEqual({ avaliacaoConcluida: false });
  });

  it('estável, em queda ou longe do limite é Normal e não leva valores', () => {
    const queda = subindo(8, -2, 80);
    const normal = avaliarPrevisao(regra(), queda[7], queda.slice(0, 7));
    expect(normal).toMatchObject({ severidade: 'Normal', disparouAlerta: false, valorObservado: null, valorLimite: null, metadados: null });

    const lento = subindo(8, 0.2, 50);
    expect(avaliarPrevisao(regra(), lento[7], lento.slice(0, 7)).severidade).toBe('Normal');
  });

  it('a janela limita as leituras usadas no ajuste', () => {
    const amostras = subindo(30, 3, 80);
    const resultado = avaliarPrevisao(regra({ janela: 10 }), amostras[29], amostras.slice(0, 29));
    expect((resultado.metadados as { amostras: number }).amostras).toBe(10);
  });

  it('o avaliador de lote inclui a regra de tendência por escova', () => {
    const amostras = subindo(8, 3, 80);
    const saida = avaliarLote([amostras[7]], new Map(), [regra()], new Map([[2, amostras.slice(0, 7)]]));
    expect(saida.get(2)![0].tipoRegra).toBe('temperatura.previsao_tendencia');
    expect(saida.get(2)![0].disparouAlerta).toBe(true);
  });
});
