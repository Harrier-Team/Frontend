import { describe, expect, it } from 'vitest';
import {
  acumularEventos,
  contarCriticosNaoVistos,
  detectarTransicoes,
  EventoSessao,
  formatarTituloAba,
  SnapshotMotor,
} from './transicoes';

function retrato(sobrescrever: Partial<SnapshotMotor> = {}): SnapshotMotor {
  return { severidade: 'Normal', situacao: 'Online', evidencia: null, escovas: {}, ...sobrescrever };
}

const limiar = { tipoRegra: 'temperatura.limiar_estatico', nomeRegra: 'Limiar estático', valor: 96.1, limite: 95 };

describe('detectarTransicoes', () => {
  it('não gera evento enquanto o estado não muda', () => {
    const a = retrato({ escovas: { 1: { severidade: 'Normal', evidencia: null } } });
    expect(detectarTransicoes(1, a, a, 10)).toEqual([]);
  });

  it('registra a escova que entrou em Crítico, com regra, valor e limite', () => {
    const antes = retrato({ escovas: { 1: { severidade: 'Normal', evidencia: null } } });
    const depois = retrato({
      severidade: 'Critico',
      evidencia: limiar,
      escovas: { 1: { severidade: 'Critico', evidencia: limiar } },
    });
    const eventos = detectarTransicoes(7, antes, depois, 99);
    expect(eventos).toHaveLength(1);
    expect(eventos[0]).toMatchObject({
      motorId: 7,
      tipo: 'escova',
      numeroEscova: 1,
      de: 'Normal',
      para: 'Critico',
      evidencia: limiar,
      em: 99,
    });
  });

  it('não repete o evento do motor quando a escova já o explica', () => {
    const antes = retrato({ escovas: { 2: { severidade: 'Atencao', evidencia: null } }, severidade: 'Atencao' });
    const depois = retrato({
      severidade: 'AlertaPreditivo',
      escovas: { 2: { severidade: 'AlertaPreditivo', evidencia: limiar } },
    });
    expect(detectarTransicoes(1, antes, depois, 1).map((e) => e.tipo)).toEqual(['escova']);
  });

  it('registra a assimetria no motor, pois nenhuma escova a explica', () => {
    const assimetria = { tipoRegra: 'temperatura.assimetria_escovas', nomeRegra: 'Assimetria', valor: 25.2, limite: 20 };
    const antes = retrato({ escovas: { 1: { severidade: 'Normal', evidencia: null } } });
    const depois = retrato({
      severidade: 'Critico',
      evidencia: assimetria,
      escovas: { 1: { severidade: 'Normal', evidencia: null } },
    });
    const eventos = detectarTransicoes(1, antes, depois, 1);
    expect(eventos).toHaveLength(1);
    expect(eventos[0]).toMatchObject({ tipo: 'motor', numeroEscova: null, de: 'Normal', para: 'Critico', evidencia: assimetria });
  });

  it('registra a recuperação para Normal', () => {
    const antes = retrato({ severidade: 'Critico', escovas: { 1: { severidade: 'Critico', evidencia: limiar } } });
    const depois = retrato({ escovas: { 1: { severidade: 'Normal', evidencia: null } } });
    expect(detectarTransicoes(1, antes, depois, 1).map((e) => [e.tipo, e.de, e.para])).toEqual([
      ['escova', 'Critico', 'Normal'],
    ]);
  });

  it('ignora a saída de "sem avaliação" para Normal, mas não para uma severidade anormal', () => {
    const antes = retrato({ severidade: null, escovas: { 1: { severidade: null, evidencia: null } } });
    expect(
      detectarTransicoes(1, antes, retrato({ escovas: { 1: { severidade: 'Normal', evidencia: null } } }), 1)
    ).toEqual([]);
    const critico = retrato({ severidade: 'Critico', escovas: { 1: { severidade: 'Critico', evidencia: limiar } } });
    expect(detectarTransicoes(1, antes, critico, 1)).toHaveLength(1);
  });

  it('não registra quando a avaliação some (severidade nula depois)', () => {
    const antes = retrato({ severidade: 'Critico', escovas: { 1: { severidade: 'Critico', evidencia: limiar } } });
    const depois = retrato({ severidade: null, escovas: { 1: { severidade: null, evidencia: null } } });
    expect(detectarTransicoes(1, antes, depois, 1)).toEqual([]);
  });

  it('registra mudança de situação Online, Degradado e Offline, sem regra', () => {
    const eventos = detectarTransicoes(1, retrato(), retrato({ situacao: 'Offline' }), 5);
    expect(eventos).toEqual([
      { em: 5, motorId: 1, tipo: 'situacao', numeroEscova: null, de: 'Online', para: 'Offline', evidencia: null },
    ]);
  });

  it('ignora situação desconhecida (null) em qualquer ponta', () => {
    expect(detectarTransicoes(1, retrato({ situacao: null }), retrato({ situacao: 'Offline' }), 1)).toEqual([]);
    expect(detectarTransicoes(1, retrato({ situacao: 'Offline' }), retrato({ situacao: null }), 1)).toEqual([]);
  });

  it('registra uma escova nova que já nasce anormal', () => {
    const antes = retrato();
    const depois = retrato({ escovas: { 3: { severidade: 'Atencao', evidencia: null } }, severidade: 'Atencao' });
    expect(detectarTransicoes(1, antes, depois, 1)[0]).toMatchObject({ numeroEscova: 3, de: null, para: 'Atencao' });
  });
});

function evento(id: number, sobrescrever: Partial<EventoSessao> = {}): EventoSessao {
  return {
    id,
    em: id,
    motorId: 1,
    tipo: 'escova',
    numeroEscova: 1,
    de: 'Normal',
    para: 'Critico',
    evidencia: null,
    ...sobrescrever,
  };
}

describe('contarCriticosNaoVistos', () => {
  const lista = [
    evento(4, { para: 'Normal', de: 'Critico' }),
    evento(3, { tipo: 'situacao', de: 'Online', para: 'Offline' }),
    evento(2),
    evento(1, { tipo: 'motor' }),
  ];

  it('conta só transições para Crítico', () => {
    expect(contarCriticosNaoVistos(lista, 0)).toBe(2);
  });

  it('descarta os já vistos', () => {
    expect(contarCriticosNaoVistos(lista, 1)).toBe(1);
    expect(contarCriticosNaoVistos(lista, 4)).toBe(0);
  });

  it('não confunde situação com severidade', () => {
    expect(contarCriticosNaoVistos([evento(1, { tipo: 'situacao', para: 'Critico' })], 0)).toBe(0);
  });
});

describe('formatarTituloAba', () => {
  it('mostra o contador só com críticos não vistos', () => {
    expect(formatarTituloAba(0)).toBe('Harrier | Telemetria de motores');
    expect(formatarTituloAba(2)).toBe('(2) Harrier | Telemetria de motores');
    expect(formatarTituloAba(1, 'Harrier')).toBe('(1) Harrier');
  });
});

describe('acumularEventos', () => {
  it('coloca o mais recente primeiro e respeita o limite', () => {
    const atuais = [evento(2), evento(1)];
    const resultado = acumularEventos(atuais, [evento(3), evento(4)], 3);
    expect(resultado.map((e) => e.id)).toEqual([4, 3, 2]);
  });

  it('devolve a mesma lista quando não há novos', () => {
    const atuais = [evento(1)];
    expect(acumularEventos(atuais, [], 5)).toBe(atuais);
  });
});
