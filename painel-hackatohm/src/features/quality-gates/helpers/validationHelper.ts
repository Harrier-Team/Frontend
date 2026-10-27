import { ParametrosRegra, TipoRegra } from '@/features/quality-gates/types/regraQualidade';
import { obterTipoRegra, TipoRegraInfo } from './tiposRegra';

export interface RegraQualidadeFormValues {
  nome: string;
  descricao: string;
  tipoRegra: TipoRegra;
  parametros: ParametrosRegra;
  ativo: boolean;
}

export type FormErrors = Partial<Record<
  'nome' | 'descricao' | 'tipo' | 'aviso' | 'critico',
  string
>>;

const normalizar = (t: string) => t.toLowerCase().replace(/[^a-z]/g, '');

/**
 * Leva os erros de campo do Problem Details (`errors`) para os campos do
 * formulário. As chaves variam de caixa e podem vir aninhadas
 * ("Parametros.Aviso"); um erro de `Parametros` sem campo vai para o crítico,
 * onde mora a regra "aviso menor que crítico". O que não casa com nenhum
 * campo fica de fora (a página mostra a mensagem geral).
 */
export function errosDoServidorParaFormulario(
  fieldErrors: Record<string, string[]> | null | undefined
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
              : ultimo === 'critico' || ultimo === 'parametros'
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

/** Mesmas regras do backend: faixa por tipo, valores finitos e aviso menor que crítico. */
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

  const erroAviso = validarLimite('aviso', aviso, info);
  if (erroAviso) errors.aviso = erroAviso;

  const erroCritico = validarLimite('crítico', critico, info);
  if (erroCritico) errors.critico = erroCritico;

  if (!errors.aviso && !errors.critico && aviso >= critico) {
    errors.critico = 'O limite crítico deve ser maior que o limite de aviso.';
  }

  return errors;
}
