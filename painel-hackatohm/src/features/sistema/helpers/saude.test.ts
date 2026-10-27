import { describe, expect, it } from 'vitest';
import { cadenciaMedianaSegundos, mapearSaude, mediana } from './saude';
import { montarPipeline } from './pipeline';

describe('mapearSaude', () => {
  it('lê o texto puro padrão do ASP.NET', () => {
    expect(mapearSaude(200, 'Healthy').estado).toBe('saudavel');
    expect(mapearSaude(200, 'Degraded').estado).toBe('degradado');
    expect(mapearSaude(503, 'Unhealthy').estado).toBe('indisponivel');
  });

  it('lê JSON com entradas, em qualquer caixa', () => {
    const r = mapearSaude(200, {
      Status: 'Degraded',
      entries: {
        postgresql: { status: 'Healthy', description: null },
        telemetria_queue: { Status: 'Degraded', description: 'Fila quase cheia.' },
      },
    });
    expect(r.estado).toBe('degradado');
    expect(r.itens).toEqual([
      { nome: 'postgresql', estado: 'saudavel', descricao: null },
      { nome: 'telemetria_queue', estado: 'degradado', descricao: 'Fila quase cheia.' },
    ]);
  });

  it('aceita enum numérico e lista de verificações', () => {
    expect(mapearSaude(200, { status: 2 }).estado).toBe('saudavel');
    expect(mapearSaude(503, { status: 0, checks: [{ name: 'db', status: 'Unhealthy' }] }).itens[0]).toMatchObject({
      nome: 'db',
      estado: 'indisponivel',
    });
  });

  it('sem corpo legível vale o código HTTP', () => {
    expect(mapearSaude(200, '').estado).toBe('saudavel');
    expect(mapearSaude(200, 'qualquer coisa').estado).toBe('saudavel');
    expect(mapearSaude(503, '').estado).toBe('indisponivel');
    expect(mapearSaude(500, '<html>erro</html>').estado).toBe('indisponivel');
  });

  it('HTTP de falha prevalece sobre um corpo otimista', () => {
    expect(mapearSaude(503, 'Healthy').estado).toBe('indisponivel');
  });

  it('falha de rede é indisponível, sem status HTTP', () => {
    expect(mapearSaude(null, null)).toMatchObject({ estado: 'indisponivel', httpStatus: null });
  });

  it('não quebra com corpo inesperado', () => {
    expect(mapearSaude(200, [1, 2]).estado).toBe('saudavel');
    expect(mapearSaude(200, { entries: 'x' }).itens).toEqual([]);
  });
});

describe('cadência', () => {
  it('mediana de valores pares e ímpares', () => {
    expect(mediana([])).toBeNull();
    expect(mediana([3, 1, 2])).toBe(2);
    expect(mediana([1, 2, 3, 10])).toBe(2.5);
  });

  it('usa o intervalo mais comum e ignora lacunas de silêncio', () => {
    const base = 1_000_000;
    const instantes = [0, 10, 20, 30, 40, 400, 410, 420].map((s) => base + s * 1000);
    expect(cadenciaMedianaSegundos([instantes])).toBe(10);
  });

  it('combina várias séries e ignora instantes repetidos', () => {
    const a = [0, 3000, 3000, 6000];
    const b = [0, 3000, 6000];
    expect(cadenciaMedianaSegundos([a, b])).toBe(3);
  });

  it('sem pelo menos dois instantes não há cadência', () => {
    expect(cadenciaMedianaSegundos([[1000], []])).toBeNull();
  });
});

describe('montarPipeline', () => {
  const saudavel = mapearSaude(200, 'Healthy');
  const base = {
    live: saudavel,
    ready: saudavel,
    hub: 'conectado' as const,
    idadeUltimoLoteSegundos: 4,
    lotesNaSessao: 12,
  };
  const estados = (e: Parameters<typeof montarPipeline>[0]) => montarPipeline(e).map((s) => s.estado);

  it('tudo saudável: todas as etapas operando, na ordem do caminho', () => {
    const etapas = montarPipeline(base);
    expect(etapas.map((s) => s.id)).toEqual(['esp', 'api', 'fila', 'banco', 'hub', 'painel']);
    expect(estados(base)).toEqual(['ok', 'ok', 'ok', 'ok', 'ok', 'ok']);
  });

  it('API fora do ar não pinta fila e banco de verde', () => {
    const fora = mapearSaude(null, null);
    expect(estados({ ...base, live: fora, ready: fora })).toEqual(['ok', 'falha', 'desconhecido', 'desconhecido', 'ok', 'ok']);
  });

  it('PostgreSQL fora aparece só no banco', () => {
    const ready = mapearSaude(503, 'Unhealthy');
    expect(estados({ ...base, ready })).toEqual(['ok', 'ok', 'ok', 'falha', 'ok', 'ok']);
  });

  it('detalha o banco pelo JSON quando houver', () => {
    const ready = mapearSaude(503, { status: 'Unhealthy', entries: { postgresql: { status: 'Unhealthy', description: 'sem conexão' } } });
    const banco = montarPipeline({ ...base, ready }).find((s) => s.id === 'banco');
    expect(banco).toMatchObject({ estado: 'falha', detalhe: 'sem conexão' });
  });

  it('fila perto da capacidade vira atenção', () => {
    expect(estados({ ...base, live: mapearSaude(200, 'Degraded') })[2]).toBe('atencao');
  });

  it('ESP: atrasado em atenção, offline em falha e sem lote desconhecido', () => {
    expect(estados({ ...base, idadeUltimoLoteSegundos: 45 })[0]).toBe('atencao');
    expect(estados({ ...base, idadeUltimoLoteSegundos: 300 })[0]).toBe('falha');
    expect(estados({ ...base, idadeUltimoLoteSegundos: null })[0]).toBe('desconhecido');
  });

  it('hub reconectando é atenção e desconectado é falha', () => {
    expect(estados({ ...base, hub: 'reconectando' })[4]).toBe('atencao');
    expect(estados({ ...base, hub: 'desconectado' })[4]).toBe('falha');
  });

  it('saúde ainda não consultada fica desconhecida, nunca verde', () => {
    expect(estados({ ...base, live: null, ready: null })).toEqual(['ok', 'desconhecido', 'desconhecido', 'desconhecido', 'ok', 'ok']);
  });
});
