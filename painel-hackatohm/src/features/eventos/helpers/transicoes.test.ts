import { describe, expect, it } from 'vitest';
import { acumularEventos, detectarConexao, detectarTransicoes, EventoSessao, SnapshotMotor } from './transicoes';
import { descreverTransicao, estadoDaPonta, rotuloDaPonta } from './apresentacao';

const retrato = (situacao: SnapshotMotor['situacao'] = 'Online'): SnapshotMotor => ({ situacao });

describe('detectarTransicoes', () => {
  it('não gera evento quando nada mudou', () => {
    expect(detectarTransicoes(1, retrato(), retrato(), 1)).toEqual([]);
  });

  it('registra a mudança de situação do motor', () => {
    expect(detectarTransicoes(1, retrato('Online'), retrato('Offline'), 5)).toEqual([
      { em: 5, motorId: 1, tipo: 'situacao', de: 'Online', para: 'Offline' },
    ]);
    expect(detectarTransicoes(1, retrato('Offline'), retrato('Degradado'), 5)[0]).toMatchObject({
      de: 'Offline',
      para: 'Degradado',
    });
  });

  it('ignora situação desconhecida (null) em qualquer ponta', () => {
    expect(detectarTransicoes(1, retrato(null), retrato('Offline'), 1)).toEqual([]);
    expect(detectarTransicoes(1, retrato('Offline'), retrato(null), 1)).toEqual([]);
  });
});

describe('detectarConexao', () => {
  it('conectar pela primeira vez não é evento', () => {
    expect(detectarConexao(null, 'desconectado', false, 1).evento).toBeNull();
    expect(detectarConexao('desconectado', 'conectando', false, 1).evento).toBeNull();
    expect(detectarConexao('conectando', 'conectado', false, 1)).toEqual({ evento: null, houveQueda: false });
  });

  it('perder a conexão é evento e a retomada só vem depois de uma queda', () => {
    const queda = detectarConexao('conectado', 'reconectando', false, 9);
    expect(queda.evento).toEqual({ em: 9, motorId: null, tipo: 'hub', de: 'conectado', para: 'reconectando' });
    expect(queda.houveQueda).toBe(true);

    const intermediario = detectarConexao('reconectando', 'desconectado', true, 10);
    expect(intermediario.evento).toBeNull();
    expect(intermediario.houveQueda).toBe(true);

    const retomada = detectarConexao('desconectado', 'conectado', true, 20);
    expect(retomada.evento).toMatchObject({ tipo: 'hub', para: 'conectado' });
    expect(retomada.houveQueda).toBe(false);
  });

  it('o mesmo estado repetido não gera evento', () => {
    expect(detectarConexao('conectado', 'conectado', false, 1).evento).toBeNull();
  });
});

function evento(id: number, sobrescrever: Partial<EventoSessao> = {}): EventoSessao {
  return { id, em: id, motorId: 1, tipo: 'situacao', de: 'Online', para: 'Offline', ...sobrescrever };
}

describe('acumularEventos', () => {
  it('mantém o mais recente primeiro e respeita o limite', () => {
    const atuais = [evento(2), evento(1)];
    expect(acumularEventos(atuais, [evento(3), evento(4)], 3).map((e) => e.id)).toEqual([4, 3, 2]);
    expect(acumularEventos(atuais, [], 3)).toBe(atuais);
  });
});

describe('apresentação', () => {
  it('rotula a situação do motor e do hub', () => {
    expect(rotuloDaPonta(evento(1), 'Offline')).toBe('Offline');
    expect(rotuloDaPonta(evento(1), 'Degradado')).toBe('Degradado');
    expect(rotuloDaPonta(evento(1), null)).toBe('Sem informação');
    expect(estadoDaPonta(evento(1, { tipo: 'hub' }), 'reconectando')).toBe('hub-reconectando');
    expect(rotuloDaPonta(evento(1, { tipo: 'hub' }), 'desconectado')).toBe('Sem conexão');
  });

  it('descreve a transição para leitores de tela', () => {
    expect(descreverTransicao(evento(1))).toBe('Online → Offline');
    expect(descreverTransicao(evento(1, { tipo: 'hub', motorId: null, de: 'conectado', para: 'reconectando' }))).toBe(
      'Conexão com o servidor perdida (Reconectando)'
    );
    expect(descreverTransicao(evento(1, { tipo: 'hub', motorId: null, de: 'desconectado', para: 'conectado' }))).toBe(
      'Conexão com o servidor restabelecida'
    );
  });
});
