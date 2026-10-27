import { describe, expect, it } from 'vitest';
import { SIMULADOR_ATIVO } from '../simuladorAtivo';
import { fracaoAquecimento, temperaturaSimulada } from './cenarios';
import { criarServidorSimulado } from './servidor';

describe('simulador', () => {
  it('fica desligado sem VITE_SIMULADOR', () => {
    expect(SIMULADOR_ATIVO).toBe(false);
  });

  it('o aquecimento sobe, mantém e esfria em ciclo', () => {
    expect(fracaoAquecimento(0)).toBe(0);
    expect(fracaoAquecimento(240)).toBeCloseTo(0.5);
    expect(fracaoAquecimento(540)).toBe(1);
    expect(fracaoAquecimento(840)).toBeCloseTo(0);
    expect(temperaturaSimulada('aquecimento', 2, 480)).toBeGreaterThan(temperaturaSimulada('aquecimento', 2, 60) + 20);
  });

  it('o motor crítico mantém a escova 2 acima do limite crítico padrão', () => {
    for (let s = 0; s < 300; s += 10) {
      expect(temperaturaSimulada('critico', 2, s)).toBeGreaterThan(95);
    }
  });
});

describe('servidor simulado', () => {
  const t0 = Date.parse('2026-10-26T14:30:00Z');
  const servidor = criarServidorSimulado(() => t0);

  it('lista os motores semeados e responde 404 em motor sem leituras', () => {
    const lista = servidor.tratar('get', '/motores', undefined);
    expect(lista.status).toBe(200);
    expect((lista.data as unknown[]).length).toBe(6);
    expect(servidor.tratar('get', '/motores/5/status', undefined).status).toBe(404);
    expect(servidor.tratar('get', '/motores/99', undefined).status).toBe(404);
  });

  it('devolve status com severidade vinda das regras, gates e assimetria repetida', () => {
    const resposta = servidor.tratar('get', '/motores/3/status', undefined);
    expect(resposta.status).toBe(200);
    const status = resposta.data as {
      severidadeGeral: string;
      escovas: Array<{ resultadosQualityGates: Array<{ tipoRegra: string }> }>;
    };
    expect(status.severidadeGeral).toBe('Critico');
    const assimetrias = status.escovas.flatMap((e) =>
      e.resultadosQualityGates.filter((g) => g.tipoRegra === 'temperatura.assimetria_escovas')
    );
    expect(assimetrias).toHaveLength(status.escovas.length);
  });

  it('o motor sem regras não tem resultados de gates', () => {
    const status = servidor.tratar('get', '/motores/6/status', undefined).data as {
      escovas: Array<{ resultadosQualityGates: unknown[] }>;
    };
    expect(status.escovas.every((e) => e.resultadosQualityGates.length === 0)).toBe(true);
  });

  it('cadastra um motor novo sem leituras e rejeita MAC repetido', () => {
    const corpo = {
      nome: 'Motor G',
      tipo: 'Teste',
      sensoresIniciais: [{ macAddress: 'AA:BB:CC:DD:EE:01', numeroEscova: 1, modelo: 'DS18B20' }],
    };
    const criado = servidor.tratar('post', '/motores', corpo);
    expect(criado.status).toBe(201);
    const id = (criado.data as { id: number }).id;
    expect(servidor.tratar('get', `/motores/${id}/status`, undefined).status).toBe(404);
    expect(servidor.tratar('post', '/motores', corpo).status).toBe(409);
  });

  it('o histórico vem em ordem e cobre os últimos minutos', () => {
    const lotes = servidor.historico(1);
    expect(lotes.length).toBeGreaterThan(30);
    const instantes = lotes.map((l) => Date.parse(l.leituras[0].dataHora));
    expect([...instantes].sort((a, b) => a - b)).toEqual(instantes);
  });
});

describe('ruído e gradiente', () => {
  it('escovas normais nunca disparam o gradiente; só a escova que aquece', () => {
    let agora = Date.parse('2026-10-26T14:30:01.037Z');
    const servidor = criarServidorSimulado(() => agora);
    const gradientesPorMotor = new Map<string, number>();
    const registrar = (motorId: number, leituras: Array<{ numeroEscova: number; resultadosQualityGates: Array<{ tipoRegra: string; disparouAlerta: boolean }> }>) => {
      for (const leitura of leituras) {
        const disparou = leitura.resultadosQualityGates.some(
          (g) => g.tipoRegra === 'temperatura.gradiente_termico' && g.disparouAlerta
        );
        if (disparou) {
          const chave = `${motorId}-${leitura.numeroEscova}`;
          gradientesPorMotor.set(chave, (gradientesPorMotor.get(chave) ?? 0) + 1);
        }
      }
    };
    for (const motorId of [1, 2, 3]) {
      for (const lote of servidor.historico(motorId)) registrar(motorId, lote.leituras);
    }
    // 20 min com jitter de timer; inclui a emenda entre o histórico e os lotes ao vivo.
    for (let i = 0; i < 400; i += 1) {
      agora += 3000 + ((i * 37) % 90) - 45;
      for (const lote of servidor.tick()) registrar(lote.status.motorId, lote.leituras);
    }
    const chaves = [...gradientesPorMotor.keys()];
    expect(chaves.filter((c) => c.startsWith('2-') || c.startsWith('3-'))).toEqual([]);
    expect(chaves.filter((c) => c === '1-1' || c === '1-3')).toEqual([]);
  });

  it('os lotes seguem a grade da cadência e não se repetem', () => {
    let agora = Date.parse('2026-10-26T14:30:00.400Z');
    const servidor = criarServidorSimulado(() => agora);
    const instantes: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      agora += 2900;
      const lote = servidor.tick().find((l) => l.status.motorId === 2);
      if (lote) instantes.push(Date.parse(lote.leituras[0].dataHora));
    }
    expect(new Set(instantes).size).toBe(instantes.length);
    for (const t of instantes) expect(t % 3000).toBe(0);
  });
});
