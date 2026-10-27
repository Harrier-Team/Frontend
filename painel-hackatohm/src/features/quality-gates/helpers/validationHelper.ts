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
  'nome' | 'descricao' | 'aviso' | 'critico',
  string
>>;

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
