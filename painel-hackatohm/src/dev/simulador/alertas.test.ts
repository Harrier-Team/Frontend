import { describe, expect, it } from 'vitest';
import { criarServidorSimulado } from './servidor';

type PaginaSimulada = {
  itens: Array<{
    id: number;
    motorId: number;
    numeroEscova: number | null;
    tipoRegra: string;
    severidade: string;
    ativo: boolean;
    categoria: string;
    regraQualidadeId: string | null;
  }>;
  pagina: number;
  tamanho: number;
  total: number;
};

describe('simulador: aquecimento lento e previsão', () => {
  /** Avança o relógio da simulação e anota quando cada gate da escova 2 do motor G dispara pela primeira vez. */
  function simular(minutos: number) {
    let agora = Date.parse('2026-10-26T14:30:01.037Z');
    const servidor = criarServidorSimulado(() => agora);
    const primeiros: Record<string, number> = {};
    const eventos: Array<{ id: number; severidade: string; tipoRegra: string }> = [];
    for (let i = 0; i < (minutos * 60) / 3; i += 1) {
      agora += 3000;
      for (const lote of servidor.tick()) {
        eventos.push(...lote.alertas.filter((a) => a.motorId === 7));
        if (lote.status.motorId !== 7) continue;
        const escova2 = lote.leituras.find((l) => l.numeroEscova === 2)!;
        for (const gate of escova2.resultadosQualityGates) {
          if (gate.disparouAlerta && !(gate.tipoRegra in primeiros)) primeiros[gate.tipoRegra] = Date.parse(escova2.dataHora);
        }
      }
    }
    return { servidor, primeiros, eventos };
  }

  it('a previsão dispara minutos antes do limite estático de aviso', () => {
    const { primeiros } = simular(25);
    const previsao = primeiros['temperatura.previsao_tendencia'];
    const estatico = primeiros['temperatura.limiar_estatico'];
    expect(previsao).toBeDefined();
    expect(estatico).toBeDefined();
    expect((estatico - previsao) / 60_000).toBeGreaterThan(5);
  });

  it('no começo do ciclo a previsão está Normal e não leva valores', () => {
    const servidor = criarServidorSimulado(() => Date.parse('2026-10-26T14:30:01.037Z'));
    const status = servidor.statusAtual(7)!;
    const gate = status.escovas[1].resultadosQualityGates.find((g) => g.tipoRegra === 'temperatura.previsao_tendencia')!;
    expect(gate.severidade).toBe('Normal');
    expect(gate.valorObservado).toBeNull();
  });

  it('o evento sai só quando o alerta abre ou sobe de severidade', () => {
    const { eventos } = simular(30);
    const previsao = eventos.filter((e) => e.tipoRegra === 'temperatura.previsao_tendencia');
    // Aviso e depois crítico, no mesmo alerta: dois eventos, não um por lote.
    expect(previsao.map((e) => e.severidade)).toEqual(['AlertaPreditivo', 'Critico']);
    expect(new Set(previsao.map((e) => e.id)).size).toBe(1);
  });

  it('o alerta é encerrado quando o gate para de disparar', () => {
    const { servidor } = simular(45);
    const todos = servidor.tratar('get', '/alertas?motorId=7&categoria=Preditivo', undefined).data as PaginaSimulada;
    expect(todos.itens.length).toBeGreaterThan(0);
    expect(todos.itens.some((a) => !a.ativo)).toBe(true);
  });
});

describe('simulador: GET /alertas', () => {
  const t0 = Date.parse('2026-10-26T14:30:00Z');
  const servidor = criarServidorSimulado(() => t0);
  const listar = (consulta: string) => servidor.tratar('get', `/alertas${consulta}`, undefined);

  it('lista os alertas abertos que o histórico gerou', () => {
    const resposta = listar('?ativo=true');
    expect(resposta.status).toBe(200);
    const pagina = resposta.data as PaginaSimulada;
    expect(pagina.total).toBeGreaterThan(0);
    expect(pagina.itens.every((a) => a.ativo)).toBe(true);
    expect(pagina).toMatchObject({ pagina: 1, tamanho: 50 });
  });

  it('o motor crítico tem alerta crítico de limiar; a assimetria é do motor inteiro', () => {
    const itens = (listar('?motorId=3&ativo=true').data as PaginaSimulada).itens;
    expect(
      itens.some((a) => a.tipoRegra === 'temperatura.limiar_estatico' && a.severidade === 'Critico' && a.numeroEscova === 2)
    ).toBe(true);
    const assimetria = itens.find((a) => a.tipoRegra === 'temperatura.assimetria_escovas');
    expect(assimetria?.numeroEscova).toBeNull();
    expect(itens.every((a) => a.motorId === 3)).toBe(true);
  });

  it('filtra por categoria e severidade, e pagina', () => {
    const condicao = (listar('?categoria=Condicao').data as PaginaSimulada).itens;
    expect(condicao.length).toBeGreaterThan(0);
    expect(condicao.every((a) => a.categoria === 'Condicao')).toBe(true);
    expect((listar('?severidade=Critico').data as PaginaSimulada).itens.every((a) => a.severidade === 'Critico')).toBe(true);

    const total = (listar('').data as PaginaSimulada).total;
    const primeira = listar('?pagina=1&tamanho=1').data as PaginaSimulada;
    const segunda = listar('?pagina=2&tamanho=1').data as PaginaSimulada;
    expect(primeira.itens).toHaveLength(1);
    expect(primeira.total).toBe(total);
    expect(segunda.itens[0].id).not.toBe(primeira.itens[0].id);
  });

  it('responde 400 a parâmetros inválidos, como o backend', () => {
    for (const ruim of ['?pagina=0', '?tamanho=0', '?tamanho=201', '?categoria=Xis', '?severidade=Normal', '?ativo=talvez']) {
      expect(listar(ruim).status).toBe(400);
    }
  });

  it('excluir a regra deixa o alerta legível, com regraQualidadeId nulo', () => {
    const local = criarServidorSimulado(() => t0);
    const antes = (local.tratar('get', '/alertas?motorId=3&ativo=true', undefined).data as PaginaSimulada).itens;
    const alvo = antes.find((a) => a.tipoRegra === 'temperatura.limiar_estatico')!;
    expect(alvo.regraQualidadeId).not.toBeNull();
    expect(local.tratar('delete', `/regras-qualidade/${alvo.regraQualidadeId}`, undefined).status).toBe(204);
    const depois = (local.tratar('get', '/alertas?motorId=3', undefined).data as PaginaSimulada).itens.find(
      (a) => a.id === alvo.id
    )!;
    expect(depois.regraQualidadeId).toBeNull();
    expect(depois.tipoRegra).toBe('temperatura.limiar_estatico');
  });
});

describe('simulador: validação das regras', () => {
  const servidor = criarServidorSimulado(() => Date.parse('2026-10-26T14:30:00Z'));
  const corpo = (tipoRegra: string, parametros: object) => ({ nome: 'Teste', tipoRegra, parametros, ativo: true });
  const criar = (tipoRegra: string, parametros: object) =>
    servidor.tratar('post', '/regras-qualidade', corpo(tipoRegra, parametros)).status;

  it('recusa temperaturaLimite e janela fora da previsão por tendência', () => {
    expect(criar('temperatura.limiar_estatico', { aviso: 80, critico: 95, temperaturaLimite: 95 })).toBe(400);
    expect(criar('temperatura.gradiente_termico', { aviso: 4, critico: 8, janela: 12 })).toBe(400);
  });

  it('aceita a previsão com aviso maior que o crítico e rejeita a ordem comum', () => {
    expect(criar('temperatura.previsao_tendencia', { aviso: 30, critico: 10, temperaturaLimite: 95 })).toBe(201);
    expect(criar('temperatura.previsao_tendencia', { aviso: 10, critico: 30, temperaturaLimite: 95 })).toBe(400);
    expect(criar('temperatura.previsao_tendencia', { aviso: 30, critico: 10 })).toBe(400);
    expect(criar('temperatura.previsao_tendencia', { aviso: 30, critico: 10, temperaturaLimite: 95, janela: 4 })).toBe(400);
  });

  it('aceita os tipos antigos só com aviso e crítico', () => {
    expect(criar('temperatura.limiar_estatico', { aviso: 80, critico: 95 })).toBe(201);
    expect(criar('temperatura.limiar_estatico', { aviso: 95, critico: 80 })).toBe(400);
  });
});
