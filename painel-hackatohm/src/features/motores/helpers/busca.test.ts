import { describe, expect, it } from 'vitest';
import { motorCombinaComBusca, normalizarBusca } from './busca';

describe('normalizarBusca', () => {
  it('remove acentos, caixa e espaços sobrando', () => {
    expect(normalizarBusca('  Trifásico   220 V ')).toBe('trifasico 220 v');
    expect(normalizarBusca(null)).toBe('');
  });
});

describe('motorCombinaComBusca', () => {
  const motor = { nome: 'Motor Ação', tipo: 'Trifásico 220 V' };

  it('ignora acentos e maiúsculas no nome e no tipo', () => {
    expect(motorCombinaComBusca(motor, 'acao')).toBe(true);
    expect(motorCombinaComBusca(motor, 'TRIFASICO')).toBe(true);
    expect(motorCombinaComBusca(motor, 'trifásico')).toBe(true);
  });

  it('exige todas as palavras, em qualquer ordem, entre nome e tipo', () => {
    expect(motorCombinaComBusca(motor, '220 acao')).toBe(true);
    expect(motorCombinaComBusca(motor, 'acao 380')).toBe(false);
  });

  it('busca vazia ou só espaços combina com tudo', () => {
    expect(motorCombinaComBusca(motor, '')).toBe(true);
    expect(motorCombinaComBusca(motor, '   ')).toBe(true);
  });
});
