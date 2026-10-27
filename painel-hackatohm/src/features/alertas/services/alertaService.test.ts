import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '@/types/api';
import { alerta } from '../testing/fabricas';

// Respostas na ordem das chamadas; a última se repete. Um Error vira rejeição.
let respostas: Array<{ data: unknown } | Error> = [];
const chamadas: string[] = [];

async function get(url: string) {
  chamadas.push(url);
  const proxima = respostas.length > 1 ? respostas.shift()! : respostas[0];
  if (proxima instanceof Error) throw proxima;
  return proxima;
}

vi.mock('@/services/api', () => ({ api: { get: (url: string) => get(url) } }));

const { alertaService } = await import('./alertaService');

beforeEach(() => {
  respostas = [];
  chamadas.length = 0;
});

describe('alertaService', () => {
  it('lista com os filtros na query e normaliza a resposta', async () => {
    respostas = [
      { data: { itens: [{ ...alerta(), severidade: 'Gravissimo' }, { lixo: true }], pagina: 2, tamanho: 50, total: 120 } },
    ];
    const pagina = await alertaService.listar({ motorId: 3, situacao: 'aberto', pagina: 2 });
    expect(chamadas).toEqual(['/alertas?motorId=3&ativo=true&pagina=2&tamanho=50']);
    expect(pagina.total).toBe(120);
    expect(pagina.itens).toHaveLength(1);
    expect(pagina.itens[0].severidade).toBe('SemClassificacao');
  });

  it('um 404 chega ao chamador, que trata como API sem alertas', async () => {
    respostas = [new ApiRequestError('Not Found', { status: 404 })];
    let status: number | undefined;
    try {
      await alertaService.listar({ pagina: 1 });
    } catch (erro) {
      status = (erro as ApiRequestError).status;
    }
    expect(status).toBe(404);
  });

  it('listarAbertos junta as páginas até cobrir o total', async () => {
    respostas = [
      { data: { itens: [alerta({ id: 1 }), alerta({ id: 2 })], pagina: 1, tamanho: 200, total: 3 } },
      { data: { itens: [alerta({ id: 3 })], pagina: 2, tamanho: 200, total: 3 } },
    ];
    const todos = await alertaService.listarAbertos();
    expect(todos.map((a) => a.id)).toEqual([1, 2, 3]);
    expect(chamadas).toEqual(['/alertas?ativo=true&pagina=1&tamanho=200', '/alertas?ativo=true&pagina=2&tamanho=200']);
  });

  it('listarAbertos para numa página vazia', async () => {
    respostas = [{ data: { itens: [], pagina: 1, tamanho: 200, total: 0 } }];
    expect(await alertaService.listarAbertos()).toEqual([]);
    expect(chamadas).toHaveLength(1);
  });
});
