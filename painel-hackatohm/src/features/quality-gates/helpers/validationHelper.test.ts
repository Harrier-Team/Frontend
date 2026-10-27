import { describe, expect, it } from 'vitest';
import {
  validarRegraQualidade,
  RegraQualidadeFormValues,
  mapearErrosRegra,
} from './validationHelper';
import { ApiRequestError } from '@/types/api';

const valoresValidos: RegraQualidadeFormValues = {
  tipoRegra: 'temperatura.limiar_estatico',
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
      parametros: { aviso: 201, critico: -60 },
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

  it('aceita os extremos -55 e 200 graus', () => {
    expect(validarRegraQualidade({
      ...valoresValidos,
      parametros: { aviso: -55, critico: 200 },
    })).toEqual({});
  });

  it('permite regras acima de 125 e rejeita valores fora da nova faixa', () => {
    expect(validarRegraQualidade({
      ...valoresValidos,
      parametros: { aviso: 150, critico: 200 },
    })).toEqual({});
    const erros = validarRegraQualidade({
      ...valoresValidos,
      parametros: { aviso: -55.1, critico: 200.1 },
    });
    expect(erros.aviso).toBeDefined();
    expect(erros.critico).toBeDefined();
  });

  it.each(['temperatura.gradiente_termico', 'temperatura.assimetria_escovas'])(
    'valida limites não negativos sem aplicar a faixa de temperatura ao tipo %s', (tipoRegra) => {
      expect(validarRegraQualidade({ ...valoresValidos, tipoRegra,
        parametros: { aviso: 0, critico: 500 } })).toEqual({});
      expect(validarRegraQualidade({ ...valoresValidos, tipoRegra,
        parametros: { aviso: -0.1, critico: 10 } }).aviso).toBeDefined();
    }
  );

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'rejeita limites não finitos %s em todos os tipos', (valor) => {
      for (const tipoRegra of ['temperatura.limiar_estatico', 'temperatura.gradiente_termico',
        'temperatura.assimetria_escovas']) {
        const result = validarRegraQualidade({ ...valoresValidos, tipoRegra,
          parametros: { aviso: valor, critico: valor } });
        expect(result.aviso).toBeDefined(); expect(result.critico).toBeDefined();
      }
    }
  );

  it('protege tipos desconhecidos e comprimentos dos textos', () => {
    const errors = validarRegraQualidade({ ...valoresValidos,
      tipoRegra: 'tipo.futuro', nome: 'x'.repeat(121), descricao: 'x'.repeat(256) });
    expect(errors.tipoRegra).toBeDefined();
    expect(errors.nome).toBeDefined(); expect(errors.descricao).toBeDefined();
  });

  it('mapeia os campos reais de Problem Details para o formulário', () => {
    expect(mapearErrosRegra(new ApiRequestError('Erro', { status: 400, errors: {
      Nome: ['Nome inválido'], Descricao: ['Muito longa'], TipoRegra: ['Tipo inválido'],
      'Parametros.Aviso': ['Aviso inválido'], 'parametros.critico': ['Crítico inválido'],
    } }))).toEqual({ nome: 'Nome inválido', descricao: 'Muito longa', tipoRegra: 'Tipo inválido',
      aviso: 'Aviso inválido', critico: 'Crítico inválido' });
    expect(mapearErrosRegra(new ApiRequestError('Erro', { errors: {
      Parametros: ['Aviso deve ser menor que crítico'],
    } }))).toEqual({ aviso: 'Aviso deve ser menor que crítico', critico: 'Aviso deve ser menor que crítico' });
    expect(mapearErrosRegra(new Error('Falha de rede'))).toEqual({});
  });
});
