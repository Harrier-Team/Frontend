import { describe, expect, it } from 'vitest';
import {
  validarRegraQualidade,
  RegraQualidadeFormValues,
} from './validationHelper';

const valoresValidos: RegraQualidadeFormValues = {
  nome: 'Temperatura crítica',
  descricao: 'Verifica o limite térmico.',
  parametros: { aviso: 60, critico: 80 },
  ativo: true,
};

describe('validarRegraQualidade', () => {
  it('aceita uma regra com limites válidos', () => {
    expect(validarRegraQualidade(valoresValidos)).toEqual({});
  });

  it('exige nome e valida o intervalo dos limites', () => {
    const erros = validarRegraQualidade({
      ...valoresValidos,
      nome: ' ',
      parametros: { aviso: 130, critico: -60 },
    });

    expect(erros.nome).toBe('O nome da regra é obrigatório.');
    expect(erros.aviso).toBeDefined();
    expect(erros.critico).toBeDefined();
  });

  it('exige que o limite crítico seja maior que o aviso', () => {
    const erros = validarRegraQualidade({
      ...valoresValidos,
      parametros: { aviso: 80, critico: 80 },
    });

    expect(erros.critico).toContain('maior');
  });
});
