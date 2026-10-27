import { describe, expect, it } from 'vitest';
import {
  errosDoServidorParaFormulario,
  validarRegraQualidade,
  RegraQualidadeFormValues,
} from './validationHelper';

const valoresValidos: RegraQualidadeFormValues = {
  nome: 'Temperatura crítica',
  descricao: 'Verifica o limite térmico.',
  tipoRegra: 'temperatura.limiar_estatico',
  parametros: { aviso: 60, critico: 80 },
  ativo: true,
};

describe('validarRegraQualidade', () => {
  it('aceita uma regra com limites válidos', () => {
    expect(validarRegraQualidade(valoresValidos)).toEqual({});
  });

  it('exige nome', () => {
    expect(validarRegraQualidade({ ...valoresValidos, nome: ' ' }).nome).toBe(
      'O nome da regra é obrigatório.'
    );
  });

  it('exige que o limite crítico seja maior que o aviso', () => {
    const erros = validarRegraQualidade({
      ...valoresValidos,
      parametros: { aviso: 80, critico: 80 },
    });

    expect(erros.critico).toContain('maior');
  });

  it('limiar estático aceita de -55 a 200 °C', () => {
    expect(
      validarRegraQualidade({ ...valoresValidos, parametros: { aviso: -55, critico: 200 } })
    ).toEqual({});

    const erros = validarRegraQualidade({
      ...valoresValidos,
      parametros: { aviso: -56, critico: 201 },
    });
    expect(erros.aviso).toContain('-55');
    expect(erros.critico).toContain('200');
  });

  it('limiar estático aceita limites acima de 125 °C', () => {
    expect(
      validarRegraQualidade({ ...valoresValidos, parametros: { aviso: 150, critico: 180 } })
    ).toEqual({});
  });

  it('gradiente térmico exige limites não negativos em °C/min', () => {
    const base = { ...valoresValidos, tipoRegra: 'temperatura.gradiente_termico' as const };
    expect(validarRegraQualidade({ ...base, parametros: { aviso: 0, critico: 10 } })).toEqual({});
    expect(validarRegraQualidade({ ...base, parametros: { aviso: 300, critico: 500 } })).toEqual({});

    const erros = validarRegraQualidade({ ...base, parametros: { aviso: -1, critico: 5 } });
    expect(erros.aviso).toContain('negativo');
  });

  it('assimetria entre escovas exige limites não negativos e aviso menor que crítico', () => {
    const base = { ...valoresValidos, tipoRegra: 'temperatura.assimetria_escovas' as const };
    expect(validarRegraQualidade({ ...base, parametros: { aviso: 10, critico: 15 } })).toEqual({});

    const negativo = validarRegraQualidade({ ...base, parametros: { aviso: -5, critico: -1 } });
    expect(negativo.aviso).toBeDefined();
    expect(negativo.critico).toBeDefined();

    const invertido = validarRegraQualidade({ ...base, parametros: { aviso: 15, critico: 10 } });
    expect(invertido.critico).toContain('maior');
  });

  it('rejeita limites não numéricos', () => {
    const erros = validarRegraQualidade({
      ...valoresValidos,
      parametros: { aviso: Number.NaN, critico: Number.POSITIVE_INFINITY },
    });
    expect(erros.aviso).toBeDefined();
    expect(erros.critico).toBeDefined();
  });
});

describe('errosDoServidorParaFormulario', () => {
  it('leva os erros do Problem Details para o campo, ignorando a caixa e o aninhamento', () => {
    const erros = errosDoServidorParaFormulario({
      Nome: ['O nome da regra é obrigatório.'],
      'Parametros.Aviso': ['Aviso inválido.'],
      Parametros: ['Aviso deve ser menor que crítico.'],
      tipoRegra: ['Tipo inválido.'],
      Outro: ['Sem campo.'],
    });
    expect(erros).toEqual({
      nome: 'O nome da regra é obrigatório.',
      aviso: 'Aviso inválido.',
      critico: 'Aviso deve ser menor que crítico.',
      tipo: 'Tipo inválido.',
    });
  });

  it('sem erros de campo, devolve objeto vazio', () => {
    expect(errosDoServidorParaFormulario(null)).toEqual({});
    expect(errosDoServidorParaFormulario({ Nome: [] })).toEqual({});
  });
});
