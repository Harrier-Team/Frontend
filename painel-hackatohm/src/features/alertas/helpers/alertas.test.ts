import { describe, expect, it, vi } from 'vitest';
import { alerta, alertaCritico, INICIO } from '../testing/fabricas';
import { criarReconhecimentos, CHAVE_ARMAZENAMENTO, LIMITE_RECONHECIDOS } from '../store/criarReconhecimentos';
import {
  chaveDoAlerta,
  contarCriticosNaoReconhecidos,
  decidirAviso,
  descreverAlerta,
  descreverDuracao,
  escopoDoAlerta,
  limiteDaMensagem,
  ordenarAlertas,
  rotuloCategoria,
} from './apresentacao';
import {
  escreverParametros,
  FILTROS_PADRAO,
  lerAba,
  lerFiltros,
  montarQuery,
  totalDePaginas,
} from './filtros';
import { normalizarAlerta, normalizarPagina } from './normalizacao';

describe('normalizarAlerta', () => {
  it('lê o item do contrato', () => {
    expect(normalizarAlerta({ ...alerta() })).toEqual(alerta());
  });

  it('assimetria tem sensor e escova nulos; regra excluída tem regraQualidadeId nulo', () => {
    const a = normalizarAlerta({ ...alerta(), sensorId: null, numeroEscova: null, regraQualidadeId: null })!;
    expect(a.sensorId).toBeNull();
    expect(a.numeroEscova).toBeNull();
    expect(a.regraQualidadeId).toBeNull();
    expect(a.nomeRegra).toBe('Previsão por tendência');
  });

  it('severidade desconhecida vira "sem classificação", nunca Normal', () => {
    expect(normalizarAlerta({ ...alerta(), severidade: 'Gravissimo' })!.severidade).toBe('SemClassificacao');
    expect(normalizarAlerta({ ...alerta(), severidade: undefined })!.severidade).toBe('SemClassificacao');
  });

  it('categoria e tipo desconhecidos não quebram', () => {
    const a = normalizarAlerta({ ...alerta(), categoria: 'Aprendizado', tipoRegra: 'ml.anomalia' })!;
    expect(a.categoria).toBe('Aprendizado');
    expect(a.tipoRegra).toBe('ml.anomalia');
  });

  it('sem categoria, deduz do tipo conhecido', () => {
    expect(normalizarAlerta({ ...alerta(), categoria: undefined })!.categoria).toBe('Preditivo');
    expect(normalizarAlerta({ ...alerta(), categoria: undefined, tipoRegra: 'x.y' })!.categoria).toBe('');
  });

  it('sem id ou motor, o item é descartado', () => {
    expect(normalizarAlerta({ ...alerta(), id: undefined })).toBeNull();
    expect(normalizarAlerta({ ...alerta(), motorId: 'três' })).toBeNull();
    expect(normalizarAlerta(null)).toBeNull();
  });

  it('deduz "ativo" do encerramento quando falta', () => {
    expect(normalizarAlerta({ ...alerta(), ativo: undefined })!.ativo).toBe(true);
    expect(normalizarAlerta({ ...alerta(), ativo: undefined, resolvidoEm: INICIO })!.ativo).toBe(false);
  });

  it('a página descarta itens inválidos e tolera campos ausentes', () => {
    const pagina = normalizarPagina({ itens: [alerta(), { lixo: true }], pagina: 2, tamanho: 50, total: 120 });
    expect(pagina).toMatchObject({ pagina: 2, tamanho: 50, total: 120 });
    expect(pagina.itens).toHaveLength(1);
    expect(normalizarPagina(undefined)).toEqual({ itens: [], pagina: 1, tamanho: 0, total: 0 });
  });
});

describe('filtros na URL', () => {
  it('lê os filtros e ignora valores inválidos', () => {
    const f = lerFiltros(
      new URLSearchParams('motorId=3&situacao=aberto&categoria=Preditivo&severidade=Critico&tipoRegra=temperatura.limiar_estatico&pagina=2')
    );
    expect(f).toEqual({
      motorId: 3,
      situacao: 'aberto',
      categoria: 'Preditivo',
      severidade: 'Critico',
      tipoRegra: 'temperatura.limiar_estatico',
      pagina: 2,
    });
    const ruins = lerFiltros(new URLSearchParams('motorId=abc&situacao=x&categoria=Y&severidade=Normal&pagina=0'));
    expect(ruins).toMatchObject({ motorId: undefined, situacao: 'todos', categoria: undefined, severidade: undefined, pagina: 1 });
  });

  it('a URL só leva o que difere do padrão', () => {
    expect(escreverParametros('abertos', FILTROS_PADRAO).toString()).toBe('');
    expect(escreverParametros('historico', FILTROS_PADRAO).toString()).toBe('aba=historico');
    expect(
      escreverParametros('historico', { ...FILTROS_PADRAO, motorId: 3, situacao: 'encerrado', categoria: 'Condicao', pagina: 2 }).toString()
    ).toBe('aba=historico&motorId=3&categoria=Condicao&situacao=encerrado&pagina=2');
  });

  it('situação e página só existem no histórico', () => {
    expect(
      escreverParametros('abertos', { ...FILTROS_PADRAO, motorId: 3, situacao: 'aberto', pagina: 4 }).toString()
    ).toBe('motorId=3');
  });

  it('ida e volta preserva os filtros', () => {
    const filtros = { motorId: 7, situacao: 'encerrado' as const, severidade: 'AlertaPreditivo' as const, pagina: 3 };
    const url = escreverParametros('historico', { ...FILTROS_PADRAO, ...filtros });
    expect(lerFiltros(url)).toMatchObject(filtros);
    expect(lerAba(url)).toBe('historico');
  });

  it('a aba desconhecida volta para "abertos"', () => {
    expect(lerAba(new URLSearchParams('aba=lixo'))).toBe('abertos');
    expect(lerAba(new URLSearchParams())).toBe('abertos');
  });
});

describe('montarQuery', () => {
  it('traduz a situação em "ativo" e limita o tamanho', () => {
    expect(montarQuery({ situacao: 'aberto', pagina: 2 })).toBe('ativo=true&pagina=2&tamanho=50');
    expect(montarQuery({ situacao: 'encerrado', motorId: 3, pagina: 1 })).toBe('motorId=3&ativo=false&pagina=1&tamanho=50');
    expect(montarQuery({ situacao: 'todos', pagina: 1 })).toBe('pagina=1&tamanho=50');
    expect(montarQuery({ ativo: true, pagina: 1, tamanho: 500 })).toBe('ativo=true&pagina=1&tamanho=200');
    expect(montarQuery({ pagina: 0, tamanho: 0 })).toBe('pagina=1&tamanho=1');
  });

  it('inclui categoria, tipo e severidade', () => {
    expect(
      montarQuery({ categoria: 'Preditivo', tipoRegra: 'temperatura.previsao_tendencia', severidade: 'Critico', pagina: 1 })
    ).toBe('categoria=Preditivo&tipoRegra=temperatura.previsao_tendencia&severidade=Critico&pagina=1&tamanho=50');
  });

  it('conta páginas', () => {
    expect(totalDePaginas(0, 50)).toBe(1);
    expect(totalDePaginas(50, 50)).toBe(1);
    expect(totalDePaginas(51, 50)).toBe(2);
    expect(totalDePaginas(320, 50)).toBe(7);
  });
});

describe('apresentação do alerta', () => {
  it('motor inteiro quando a escova é nula', () => {
    expect(escopoDoAlerta(alerta({ numeroEscova: null }))).toBe('Motor inteiro');
    expect(escopoDoAlerta(alerta())).toBe('Escova 2');
  });

  it('rotula a categoria; a desconhecida aparece como veio', () => {
    expect(rotuloCategoria('Aceleracao')).toBe('Aceleração');
    expect(rotuloCategoria('Aprendizado')).toBe('Aprendizado');
    expect(rotuloCategoria('')).toBe('Sem categoria');
  });

  it('monta o texto principal com a unidade do tipo e a vírgula decimal', () => {
    expect(descreverAlerta(alertaCritico(), 'Motor C')).toBe('Escova 2 de Motor C: limite de temperatura, 96,1 °C ≥ 95 °C');
    expect(
      descreverAlerta(
        alerta({ tipoRegra: 'temperatura.gradiente_termico', valorObservado: 6.2, valorLimite: 5 }),
        'Motor C'
      )
    ).toBe('Escova 2 de Motor C: velocidade de aquecimento, 6,2 °C/min ≥ 5 °C/min');
  });

  it('a assimetria fala do motor, não de uma escova', () => {
    expect(
      descreverAlerta(
        alerta({ tipoRegra: 'temperatura.assimetria_escovas', numeroEscova: null, valorObservado: 25.2, valorLimite: 15 }),
        'Motor A'
      )
    ).toBe('Motor A: diferença entre escovas, 25,2 °C ≥ 15 °C');
  });

  it('a previsão diz o alvo e o tempo, com a temperatura lida da mensagem do backend', () => {
    expect(descreverAlerta(alerta(), 'Motor A')).toBe('Escova 2 de Motor A deve atingir 95 °C em ~8 min');
    expect(descreverAlerta(alerta({ mensagem: 'sem número' }), 'Motor A')).toBe(
      'Escova 2 de Motor A: tempo até o limite, ~8 min'
    );
  });

  it('tipo desconhecido mostra o número sem unidade', () => {
    expect(
      descreverAlerta(
        alerta({ tipoRegra: 'ml.anomalia', categoria: 'Preditivo', valorObservado: 0.87, valorLimite: 0.8, numeroEscova: 1 }),
        'Motor A'
      )
    ).toBe('Escova 1 de Motor A: ml.anomalia, 0,87 ≥ 0,8');
  });

  it('lê o limite da mensagem com ponto ou vírgula', () => {
    expect(limiteDaMensagem('A escova 2 tende a atingir 95.0 °C em ~8 min')).toBe(95);
    expect(limiteDaMensagem('tende a atingir 82,5 °C')).toBe(82.5);
    expect(limiteDaMensagem('tende a atingir -5.0 °C')).toBe(-5);
    expect(limiteDaMensagem('outra coisa')).toBeNull();
    expect(limiteDaMensagem(null)).toBeNull();
  });

  it('duração: aberto há, durou', () => {
    const agora = Date.parse(INICIO) + 12 * 60_000;
    expect(descreverDuracao(alerta(), agora)).toBe('aberto há 12 min');
    const encerrado = alerta({ ativo: false, resolvidoEm: '2026-10-27T14:34:00+00:00' });
    expect(descreverDuracao(encerrado, agora)).toBe('durou 4 min');
    expect(descreverDuracao(alerta({ iniciadoEm: 'lixo' }), agora)).toBe('—');
  });

  it('ordena por severidade e, depois, pelo início mais recente', () => {
    const lista = [
      alerta({ id: 1, severidade: 'AlertaPreditivo', iniciadoEm: '2026-10-27T14:00:00+00:00' }),
      alerta({ id: 2, severidade: 'Critico', iniciadoEm: '2026-10-27T13:00:00+00:00' }),
      alerta({ id: 3, severidade: 'AlertaPreditivo', iniciadoEm: '2026-10-27T15:00:00+00:00' }),
    ];
    expect(ordenarAlertas(lista).map((a) => a.id)).toEqual([2, 3, 1]);
  });
});

describe('avisos a partir de ReceberAlertaManutencao', () => {
  const abrir = vi.fn();

  it('crítico vira toast crítico com o motivo', () => {
    const aviso = decidirAviso(alertaCritico(), 'Motor C', abrir)!;
    expect(aviso.tom).toBe('critico');
    expect(aviso.titulo).toBe('Motor C ficou crítico');
    expect(aviso.mensagem).toBe('Escova 2 de Motor C: limite de temperatura, 96,1 °C ≥ 95 °C');
    aviso.acao!.aoClicar();
    expect(abrir).toHaveBeenCalled();
  });

  it('previsão nova vira um toast discreto', () => {
    const aviso = decidirAviso(alerta(), 'Motor A', abrir)!;
    expect(aviso.tom).toBe('info');
    expect(aviso.titulo).toBe('Previsão: Motor A, escova 2 → 95 °C em ~8 min');
  });

  it('previsão crítica avisa como crítico', () => {
    expect(decidirAviso(alerta({ severidade: 'Critico' }), 'Motor A', abrir)!.tom).toBe('critico');
  });

  it('alertas de condição ou aceleração que não são críticos não geram toast', () => {
    expect(decidirAviso(alertaCritico({ severidade: 'AlertaPreditivo' }), 'Motor C', abrir)).toBeNull();
    expect(decidirAviso(alerta({ categoria: 'Aceleracao', tipoRegra: 'temperatura.gradiente_termico' }), 'Motor C', abrir)).toBeNull();
  });

  it('previsão sem a temperatura na mensagem ainda avisa, sem inventar número', () => {
    expect(decidirAviso(alerta({ mensagem: '' }), 'Motor A', abrir)!.titulo).toBe(
      'Previsão: Motor A, escova 2 tende a atingir o limite'
    );
  });
});

describe('contador de críticos não reconhecidos', () => {
  const armazenamento = () => {
    const dados = new Map<string, string>();
    return {
      getItem: (k: string) => dados.get(k) ?? null,
      setItem: (k: string, v: string) => void dados.set(k, v),
      dados,
    };
  };

  it('conta só críticos em aberto sem reconhecimento', () => {
    const abertos = [alertaCritico({ id: 1 }), alertaCritico({ id: 2 }), alerta({ id: 3 })];
    expect(contarCriticosNaoReconhecidos(abertos, new Set())).toBe(2);
    expect(contarCriticosNaoReconhecidos(abertos, new Set([chaveDoAlerta(abertos[0])]))).toBe(1);
    expect(contarCriticosNaoReconhecidos([alertaCritico({ ativo: false })], new Set())).toBe(0);
  });

  it('reconhecer grava no storage e avisa os ouvintes', () => {
    const storage = armazenamento();
    const r = criarReconhecimentos(storage);
    const ouvinte = vi.fn();
    r.subscribe(ouvinte);
    r.reconhecer([alertaCritico({ id: 1 })]);
    r.reconhecer([alertaCritico({ id: 1 })]);
    expect(ouvinte).toHaveBeenCalledTimes(1);
    expect(JSON.parse(storage.dados.get(CHAVE_ARMAZENAMENTO)!)).toEqual([chaveDoAlerta(alertaCritico({ id: 1 }))]);
    expect(criarReconhecimentos(storage).obterReconhecidos().size).toBe(1);
  });

  it('um alerta novo com o mesmo id (banco recriado) volta a contar', () => {
    const r = criarReconhecimentos(armazenamento());
    r.reconhecer([alertaCritico({ id: 1 })]);
    const novo = alertaCritico({ id: 1, iniciadoEm: '2026-10-28T10:00:00+00:00' });
    expect(contarCriticosNaoReconhecidos([novo], r.obterReconhecidos())).toBe(1);
  });

  it('funciona sem storage ou com storage que falha', () => {
    const semStorage = criarReconhecimentos(null);
    semStorage.reconhecer([alertaCritico()]);
    expect(semStorage.obterReconhecidos().size).toBe(1);

    const quebrado = criarReconhecimentos({
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('cheio');
      },
    });
    expect(() => quebrado.reconhecer([alertaCritico()])).not.toThrow();
    expect(quebrado.obterReconhecidos().size).toBe(1);
  });

  it('conteúdo corrompido é ignorado e o limite de memória é respeitado', () => {
    const corrompido = criarReconhecimentos({ getItem: () => '{nao e json', setItem: () => undefined });
    expect(corrompido.obterReconhecidos().size).toBe(0);

    const r = criarReconhecimentos(armazenamento());
    r.reconhecer(Array.from({ length: LIMITE_RECONHECIDOS + 5 }, (_, i) => alertaCritico({ id: i + 1 })));
    expect(r.obterReconhecidos().size).toBe(LIMITE_RECONHECIDOS);
    expect(r.obterReconhecidos().has(chaveDoAlerta(alertaCritico({ id: 1 })))).toBe(false);
  });
});
