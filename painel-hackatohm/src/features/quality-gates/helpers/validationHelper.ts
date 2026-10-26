import { ParametrosLimiarTemperatura } from '@/features/quality-gates/types/regraQualidade';

export interface RegraQualidadeFormValues {
  nome: string;
  descricao: string;
  parametros: ParametrosLimiarTemperatura;
  ativo: boolean;
}

export type FormErrors = Partial<Record<
  'nome' | 'descricao' | 'aviso' | 'critico',
  string
>>;

export function validarRegraQualidade(
  values: RegraQualidadeFormValues
): FormErrors {
  const errors: FormErrors = {};
  const { aviso, critico } = values.parametros;

  if (!values.nome.trim()) {
    errors.nome = 'O nome da regra é obrigatório.';
  } else if (values.nome.length > 120) {
    errors.nome = 'O nome deve ter no máximo 120 caracteres.';
  }

  if (values.descricao.length > 255) {
    errors.descricao = 'A descrição deve ter no máximo 255 caracteres.';
  }

  if (!Number.isFinite(aviso) || aviso < -55 || aviso > 200) {
    errors.aviso = 'O limite de aviso deve estar entre -55 °C e 200 °C.';
  }

  if (!Number.isFinite(critico) || critico < -55 || critico > 200) {
    errors.critico = 'O limite crítico deve estar entre -55 °C e 200 °C.';
  }

  if (!errors.aviso && !errors.critico && aviso >= critico) {
    errors.critico = 'O limite crítico deve ser maior que o limite de aviso.';
  }

  return errors;
}
