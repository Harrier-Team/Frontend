import { describe, expect, it } from 'vitest';
import {
  compararPorUrgencia,
  consolidarSeveridade,
  ehSeveridadeAnormal,
  estadoAvaliacao,
  estadoDado,
  estadoPrincipal,
  estadoResultado,
  frescor,
  maiorSeveridade,
} from './estadoHelper';
import { gate, gateAguardando, gateAlerta, iso, T0 } from '../testing/fabricas';

describe('estadoResultado', () => {
  it('trata DADOS_INSUFICIENTES como aguardando amostras, não como normal', () => {
    expect(estadoResultado(gateAguardando())).toBe('aguardando-amostras');
  });

  it('trata avaliacaoConcluida=false como aguardando amostras mesmo com outro código', () => {
    expect(estadoResultado(gate({ metadados: { avaliacaoConcluida: false } }))).toBe(
      'aguardando-amostras'
    );
  });

  it('considera avaliado o resultado normal comum', () => {
    expect(estadoResultado(gate())).toBe('avaliado');
    expect(estadoResultado(gate({ metadados: { avaliacaoConcluida: true } }))).toBe('avaliado');
  });
});

describe('estadoAvaliacao', () => {
  it('sem leitura vence qualquer lista', () => {
    expect(estadoAvaliacao([gate()], false)).toBe('sem-leitura');
  });

  it('lista vazia é "sem regras"', () => {
    expect(estadoAvaliacao([], true)).toBe('sem-regras');
    expect(estadoAvaliacao(undefined, true)).toBe('sem-regras');
  });

  it('só resultados sem amostras suficientes é "aguardando amostras"', () => {
    expect(estadoAvaliacao([gateAguardando()], true)).toBe('aguardando-amostras');
  });

  it('um resultado avaliado basta para a avaliação ser concluída', () => {
    expect(estadoAvaliacao([gateAguardando(), gate()], true)).toBe('avaliada');
  });
});

describe('consolidarSeveridade', () => {
  it('usa a maior severidade enviada pelo backend', () => {
    expect(
      consolidarSeveridade([gate(), gateAlerta('AlertaPreditivo'), gateAlerta('Critico'), gate()])
    ).toBe('Critico');
  });

  it('não depende da temperatura nem de alertaDesgaste', () => {
    expect(consolidarSeveridade([gate({ valorObservado: 300 })])).toBe('Normal');
  });

  it('ignora resultados sem amostras suficientes', () => {
    expect(consolidarSeveridade([gateAguardando()])).toBeNull();
    expect(consolidarSeveridade([gateAguardando(), gateAlerta('Atencao')])).toBe('Atencao');
  });

  it('retorna null sem resultados', () => {
    expect(consolidarSeveridade([])).toBeNull();
    expect(consolidarSeveridade(null)).toBeNull();
  });

  it('maiorSeveridade ignora ausentes', () => {
    expect(maiorSeveridade([null, 'Normal', undefined, 'Atencao'])).toBe('Atencao');
    expect(maiorSeveridade([null])).toBeNull();
  });
});

describe('frescor e estado do dado', () => {
  it('ao vivo com menos de 30 s e atrasado a partir de 30 s', () => {
    expect(frescor(iso(0), T0 + 29_000)).toBe('ao-vivo');
    expect(frescor(iso(0), T0 + 30_000)).toBe('atrasado');
    expect(frescor(iso(0), T0 + 100_000)).toBe('atrasado');
  });

  it('sem leitura quando não há instante válido', () => {
    expect(frescor(null, T0)).toBe('sem-leitura');
    expect(frescor('inválido', T0)).toBe('sem-leitura');
  });

  it('relógio do cliente atrás do servidor não gera idade negativa', () => {
    expect(frescor(iso(5), T0)).toBe('ao-vivo');
  });

  it('Degradado e Offline vêm da situação do backend', () => {
    expect(estadoDado(iso(0), 'Online', T0 + 5_000)).toBe('ao-vivo');
    expect(estadoDado(iso(0), 'Online', T0 + 60_000)).toBe('atrasado');
    expect(estadoDado(iso(0), 'Degradado', T0 + 5_000)).toBe('degradado');
    expect(estadoDado(iso(0), 'Offline', T0 + 130_000)).toBe('offline');
    expect(estadoDado(null, 'Offline', T0)).toBe('sem-leitura');
  });
});

describe('estadoPrincipal e ordenação', () => {
  it('severidade anormal prevalece mesmo com dado offline', () => {
    expect(estadoPrincipal('Critico', 'avaliada', 'offline')).toBe('Critico');
  });

  it('offline e degradado explicam a falta de dado quando não há severidade anormal', () => {
    expect(estadoPrincipal('Normal', 'avaliada', 'offline')).toBe('offline');
    expect(estadoPrincipal('Normal', 'avaliada', 'degradado')).toBe('degradado');
  });

  it('estados de avaliação nunca viram Normal', () => {
    expect(estadoPrincipal(null, 'aguardando-amostras', 'ao-vivo')).toBe('aguardando-amostras');
    expect(estadoPrincipal(null, 'sem-regras', 'ao-vivo')).toBe('sem-regras');
    expect(estadoPrincipal(null, 'sem-leitura', 'sem-leitura')).toBe('sem-leitura');
    expect(estadoPrincipal('Normal', 'avaliada', 'ao-vivo')).toBe('Normal');
  });

  it('ordena Crítico > Alerta > Atenção > Offline > Degradado > Aguardando > Sem regras > Normal', () => {
    const esperada = [
      'Critico',
      'AlertaPreditivo',
      'Atencao',
      'offline',
      'degradado',
      'aguardando-amostras',
      'sem-regras',
      'Normal',
    ] as const;
    const embaralhada = [...esperada].reverse();
    expect(embaralhada.sort(compararPorUrgencia)).toEqual([...esperada]);
  });
});

describe('severidade desconhecida (Sem classificação)', () => {
  it('não é anormal, não pinta de cor e nunca vira Normal', () => {
    expect(ehSeveridadeAnormal('SemClassificacao')).toBe(false);
    expect(estadoPrincipal('SemClassificacao', 'avaliada', 'ao-vivo')).toBe('SemClassificacao');
  });

  it('perde para qualquer severidade anormal e ganha de Normal ao consolidar', () => {
    expect(maiorSeveridade(['Normal', 'SemClassificacao'])).toBe('SemClassificacao');
    expect(maiorSeveridade(['SemClassificacao', 'Atencao'])).toBe('Atencao');
    expect(consolidarSeveridade([gate({ severidade: 'SemClassificacao' }), gate()])).toBe('SemClassificacao');
  });

  it('falta de dado explica o estado antes dela', () => {
    expect(estadoPrincipal('SemClassificacao', 'avaliada', 'offline')).toBe('offline');
  });
});
