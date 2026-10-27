import { describe, expect, it } from 'vitest';
import { limitesDoLimiarEstatico } from './limitesHelper';
import { RegraQualidade, VinculoRegraQualidade } from '../types/regraQualidade';

function vinculo(regra: Partial<RegraQualidade>, ativo = true): VinculoRegraQualidade {
  return {
    motorId: 1,
    regraQualidadeId: regra.id ?? 'r',
    ativo,
    vinculadoEm: '2026-01-01T00:00:00Z',
    regra: {
      id: 'r',
      nome: 'Regra',
      descricao: null,
      tipoRegra: 'temperatura.limiar_estatico',
      severidadePadrao: 'AlertaPreditivo',
      parametros: { aviso: 80, critico: 95 },
      ativo: true,
      criadoEm: '2026-01-01T00:00:00Z',
      ...regra,
    },
  };
}

describe('limitesDoLimiarEstatico', () => {
  it('sem vínculos não há limites', () => {
    expect(limitesDoLimiarEstatico([])).toBeNull();
    expect(limitesDoLimiarEstatico(undefined)).toBeNull();
  });

  it('usa os limites da regra de limiar estático ativa', () => {
    expect(limitesDoLimiarEstatico([vinculo({})])).toEqual({ aviso: 80, critico: 95 });
  });

  it('ignora gradiente, assimetria e regras ou vínculos desativados', () => {
    expect(
      limitesDoLimiarEstatico([
        vinculo({ tipoRegra: 'temperatura.gradiente_termico', parametros: { aviso: 5, critico: 10 } }),
        vinculo({ tipoRegra: 'temperatura.assimetria_escovas' }),
        vinculo({ ativo: false }),
        vinculo({}, false),
      ])
    ).toBeNull();
  });

  it('com várias regras estáticas usa a de menor limite crítico', () => {
    expect(
      limitesDoLimiarEstatico([
        vinculo({ parametros: { aviso: 90, critico: 120 } }),
        vinculo({ parametros: { aviso: 60, critico: 85 } }),
      ])
    ).toEqual({ aviso: 60, critico: 85 });
  });
});
