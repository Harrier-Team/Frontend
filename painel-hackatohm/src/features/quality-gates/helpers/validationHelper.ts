import { ParametrosRegra, TipoRegra } from '@/features/quality-gates/types/regraQualidade';
import { ehPrevisao, obterTipoRegra, TipoRegraInfo } from './tiposRegra';

export interface RegraQualidadeFormValues {
  nome: string;
  descricao: string;
  tipoRegra: TipoRegra;
  parametros: ParametrosRegra;
  ativo: boolean;
}

export type FormErrors = Partial<Record<
  'nome' | 'descricao' | 'tipo' | 'aviso' | 'critico' | 'temperaturaLimite' | 'janela' | 'parametros',
  string
>>;

export const JANELA_MINIMA = 5;
export const JANELA_MAXIMA = 60;
/** Padrão do backend quando a janela não é enviada. */
export const JANELA_PADRAO = 12;
export const LIMITE_TEMPERATURA_MINIMO = -55;
export const LIMITE_TEMPERATURA_MAXIMO = 200;

const normalizar = (t: string) => t.toLowerCase().replace(/[^a-z]/g, '');

/**
 * Leva os erros de campo do Problem Details (`errors`) para os campos do
 * formulário. As chaves variam de caixa e podem vir aninhadas
 * ("Parametros.Aviso"); um erro de `Parametros` sem campo vai para o crítico,
 * onde mora a regra "aviso menor que crítico". Na previsão por tendência o
 * backend também devolve uma única mensagem para `Parametros`, mas ela vale
 * para o conjunto: aparece no topo do formulário (`parametros`). O que não
 * casa com nenhum campo fica de fora (a página mostra a mensagem geral).
 */
export function errosDoServidorParaFormulario(
  fieldErrors: Record<string, string[]> | null | undefined,
  tipoRegra?: string | null
): FormErrors {
  const erros: FormErrors = {};
  for (const [chave, mensagens] of Object.entries(fieldErrors ?? {})) {
    const mensagem = mensagens.find((m) => typeof m === 'string' && m.trim() !== '');
    if (!mensagem) continue;
    const ultimo = normalizar(chave.split('.').pop() ?? chave);
    const campo: keyof FormErrors | null =
      ultimo === 'nome'
        ? 'nome'
        : ultimo === 'descricao'
          ? 'descricao'
          : ultimo === 'tiporegra'
            ? 'tipo'
            : ultimo === 'aviso'
              ? 'aviso'
              : ultimo === 'temperaturalimite'
                ? 'temperaturaLimite'
                : ultimo === 'janela'
                  ? 'janela'
                  : ultimo === 'parametros'
                    ? ehPrevisao(tipoRegra)
                      ? 'parametros'
                      : 'critico'
                    : ultimo === 'critico'
                      ? 'critico'
                      : null;
    if (campo && !erros[campo]) erros[campo] = mensagem;
  }
  return erros;
}

function validarLimite(nomeLimite: string, valor: number, info: TipoRegraInfo): string | null {
  const unidade = info.unidadeLonga;

  if (!Number.isFinite(valor)) {
    return `Informe o limite de ${nomeLimite} em ${unidade}.`;
  }
  if (info.min !== null && info.max !== null && (valor < info.min || valor > info.max)) {
    return `O limite de ${nomeLimite} deve estar entre ${info.min} e ${info.max} ${unidade}.`;
  }
  if (info.min !== null && valor < info.min) {
    return info.min === 0
      ? `O limite de ${nomeLimite} não pode ser negativo.`
      : `O limite de ${nomeLimite} deve ser de pelo menos ${info.min} ${unidade}.`;
  }
  if (info.max !== null && valor > info.max) {
    return `O limite de ${nomeLimite} deve ser de no máximo ${info.max} ${unidade}.`;
  }
  return null;
}

function validarPrevisao(values: RegraQualidadeFormValues, errors: FormErrors) {
  const { aviso, critico, temperaturaLimite, janela } = values.parametros;

  if (!Number.isFinite(critico)) {
    errors.critico = 'Informe os minutos de antecedência do estado crítico.';
  } else if (critico <= 0) {
    errors.critico = 'Os minutos do crítico devem ser maiores que zero.';
  }

  if (!Number.isFinite(aviso)) {
    errors.aviso = 'Informe os minutos de antecedência do aviso.';
  } else if (!errors.critico && aviso <= critico) {
    // Ordem invertida em relação às outras regras: o aviso vem antes, com mais minutos.
    errors.aviso = 'O aviso deve ter mais minutos que o crítico: ele avisa mais cedo.';
  }

  if (typeof temperaturaLimite !== 'number' || !Number.isFinite(temperaturaLimite)) {
    errors.temperaturaLimite = 'Informe a temperatura que se quer antecipar, em °C.';
  } else if (temperaturaLimite < LIMITE_TEMPERATURA_MINIMO || temperaturaLimite > LIMITE_TEMPERATURA_MAXIMO) {
    errors.temperaturaLimite = `A temperatura deve estar entre ${LIMITE_TEMPERATURA_MINIMO} e ${LIMITE_TEMPERATURA_MAXIMO} °C.`;
  }

  // Janela vazia vale o padrão do backend.
  if (typeof janela === 'number' && !Number.isNaN(janela)) {
    if (!Number.isInteger(janela) || janela < JANELA_MINIMA || janela > JANELA_MAXIMA) {
      errors.janela = `A janela deve ser um número inteiro de ${JANELA_MINIMA} a ${JANELA_MAXIMA} leituras.`;
    }
  }
}

/**
 * Corpo de `parametros` para o POST e o PUT. `temperaturaLimite` e `janela`
 * só existem na previsão por tendência: o backend responde 400 se forem
 * enviados nos outros tipos. Janela vazia é omitida (vale o padrão).
 */
export function montarParametros(tipoRegra: string, parametros: ParametrosRegra): ParametrosRegra {
  const base: ParametrosRegra = { aviso: parametros.aviso, critico: parametros.critico };
  if (!ehPrevisao(tipoRegra)) return base;
  base.temperaturaLimite = parametros.temperaturaLimite;
  if (typeof parametros.janela === 'number' && Number.isFinite(parametros.janela)) {
    base.janela = parametros.janela;
  }
  return base;
}

/** Mesmas regras do backend: faixa por tipo, valores finitos e aviso menor que crítico (na previsão, o inverso). */
export function validarRegraQualidade(
  values: RegraQualidadeFormValues
): FormErrors {
  const errors: FormErrors = {};
  const { aviso, critico } = values.parametros;
  const info = obterTipoRegra(values.tipoRegra);

  if (!values.nome.trim()) {
    errors.nome = 'O nome da regra é obrigatório.';
  } else if (values.nome.length > 120) {
    errors.nome = 'O nome deve ter no máximo 120 caracteres.';
  }

  if (values.descricao.length > 255) {
    errors.descricao = 'A descrição deve ter no máximo 255 caracteres.';
  }

  if (ehPrevisao(values.tipoRegra)) {
    validarPrevisao(values, errors);
    return errors;
  }

  const erroAviso = validarLimite('aviso', aviso, info);
  if (erroAviso) errors.aviso = erroAviso;

  const erroCritico = validarLimite('crítico', critico, info);
  if (erroCritico) errors.critico = erroCritico;

  if (!errors.aviso && !errors.critico && aviso >= critico) {
    errors.critico = 'O limite crítico deve ser maior que o limite de aviso.';
  }

  return errors;
}
