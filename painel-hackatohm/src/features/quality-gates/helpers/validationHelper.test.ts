import { describe, expect, it } from 'vitest';
import {
  errosDoServidorParaFormulario,
  montarParametros,
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

describe('validarRegraQualidade: previsão por tendência', () => {
  const previsao: RegraQualidadeFormValues = {
    nome: 'Tempo até o limite',
    descricao: '',
    tipoRegra: 'temperatura.previsao_tendencia',
    parametros: { aviso: 30, critico: 10, temperaturaLimite: 95 },
    ativo: true,
  };
  const com = (parametros: Partial<RegraQualidadeFormValues['parametros']>) => ({
    ...previsao,
    parametros: { ...previsao.parametros, ...parametros },
  });

  it('aceita aviso com mais minutos que o crítico', () => {
    expect(validarRegraQualidade(previsao)).toEqual({});
  });

  it('a ordem é invertida: aviso igual ou menor que o crítico é erro', () => {
    expect(validarRegraQualidade(com({ aviso: 10, critico: 10 })).aviso).toContain('mais minutos');
    expect(validarRegraQualidade(com({ aviso: 5, critico: 10 })).aviso).toContain('mais minutos');
  });

  it('o crítico precisa ser maior que zero', () => {
    expect(validarRegraQualidade(com({ critico: 0 })).critico).toContain('maiores que zero');
    expect(validarRegraQualidade(com({ critico: -2 })).critico).toContain('maiores que zero');
    expect(validarRegraQualidade(com({ critico: Number.NaN })).critico).toBeDefined();
  });

  it('a temperatura limite é obrigatória e fica entre -55 e 200', () => {
    expect(validarRegraQualidade(com({ temperaturaLimite: undefined })).temperaturaLimite).toBeDefined();
    expect(validarRegraQualidade(com({ temperaturaLimite: Number.NaN })).temperaturaLimite).toBeDefined();
    expect(validarRegraQualidade(com({ temperaturaLimite: 201 })).temperaturaLimite).toContain('entre -55 e 200');
    expect(validarRegraQualidade(com({ temperaturaLimite: -56 })).temperaturaLimite).toBeDefined();
    expect(validarRegraQualidade(com({ temperaturaLimite: -55 })).temperaturaLimite).toBeUndefined();
    expect(validarRegraQualidade(com({ temperaturaLimite: 200 })).temperaturaLimite).toBeUndefined();
  });

  it('a janela é opcional e, se informada, inteira de 5 a 60', () => {
    expect(validarRegraQualidade(com({ janela: undefined })).janela).toBeUndefined();
    expect(validarRegraQualidade(com({ janela: Number.NaN })).janela).toBeUndefined();
    expect(validarRegraQualidade(com({ janela: 5 })).janela).toBeUndefined();
    expect(validarRegraQualidade(com({ janela: 60 })).janela).toBeUndefined();
    expect(validarRegraQualidade(com({ janela: 4 })).janela).toBeDefined();
    expect(validarRegraQualidade(com({ janela: 61 })).janela).toBeDefined();
    expect(validarRegraQualidade(com({ janela: 12.5 })).janela).toContain('inteiro');
  });
});

describe('montarParametros', () => {
  it('só a previsão envia temperaturaLimite e janela', () => {
    const completo = { aviso: 30, critico: 10, temperaturaLimite: 95, janela: 12 };
    expect(montarParametros('temperatura.previsao_tendencia', completo)).toEqual(completo);
    expect(montarParametros('temperatura.limiar_estatico', completo)).toEqual({ aviso: 30, critico: 10 });
    expect(montarParametros('temperatura.gradiente_termico', completo)).toEqual({ aviso: 30, critico: 10 });
    expect(montarParametros('temperatura.assimetria_escovas', completo)).toEqual({ aviso: 30, critico: 10 });
  });

  it('janela vazia é omitida e o corpo não leva NaN', () => {
    const corpo = montarParametros('temperatura.previsao_tendencia', {
      aviso: 30,
      critico: 10,
      temperaturaLimite: 95,
      janela: Number.NaN,
    });
    expect(corpo).toEqual({ aviso: 30, critico: 10, temperaturaLimite: 95 });
    expect('janela' in corpo).toBe(false);
  });
});

describe('errosDoServidorParaFormulario: previsão', () => {
  it('o erro único de Parametros vai para o topo do formulário', () => {
    const erros = errosDoServidorParaFormulario({ Parametros: ['inválido'] }, 'temperatura.previsao_tendencia');
    expect(erros).toEqual({ parametros: 'inválido' });
  });

  it('nos outros tipos continua no campo crítico', () => {
    expect(errosDoServidorParaFormulario({ Parametros: ['inválido'] }, 'temperatura.limiar_estatico')).toEqual({
      critico: 'inválido',
    });
    expect(errosDoServidorParaFormulario({ Parametros: ['inválido'] })).toEqual({ critico: 'inválido' });
  });

  it('leva temperaturaLimite e janela para os campos', () => {
    expect(
      errosDoServidorParaFormulario(
        { 'Parametros.TemperaturaLimite': ['x'], 'Parametros.Janela': ['y'] },
        'temperatura.previsao_tendencia'
      )
    ).toEqual({ temperaturaLimite: 'x', janela: 'y' });
  });
});
