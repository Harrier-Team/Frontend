import { ParametrosLimiarTemperatura } from '@/features/quality-gates/types/regraQualidade';
import { obterTipoRegra } from './tipoRegraHelper';
import { obterErrosDeCampo } from '@/utils/errorHelper';

export interface RegraQualidadeFormValues {
  tipoRegra: string;
  nome: string;
  descricao: string;
  parametros: ParametrosLimiarTemperatura;
  ativo: boolean;
}

export type FormErrors = Partial<Record<
  'nome' | 'descricao' | 'tipoRegra' | 'aviso' | 'critico',
  string
>>;

export function validarRegraQualidade(
  values: RegraQualidadeFormValues
): FormErrors {
  const errors: FormErrors = {};
  const { aviso, critico } = values.parametros;
  const tipo = obterTipoRegra(values.tipoRegra);
  if (!tipo) errors.tipoRegra = 'Selecione um tipo de regra suportado.';

  if (!values.nome.trim()) {
    errors.nome = 'O nome da regra é obrigatório.';
  } else if (values.nome.length > 120) {
    errors.nome = 'O nome deve ter no máximo 120 caracteres.';
  }

  if (values.descricao.length > 255) {
    errors.descricao = 'A descrição deve ter no máximo 255 caracteres.';
  }

  for (const [campo, valor] of [['aviso', aviso], ['critico', critico]] as const) {
    if (!Number.isFinite(valor)) {
      errors[campo] = 'Informe um número finito.';
    } else if (tipo && (valor < tipo.minimo || (tipo.maximo !== undefined && valor > tipo.maximo))) {
      errors[campo] = tipo.maximo === undefined
        ? `O limite deve ser maior ou igual a ${tipo.minimo} ${tipo.unidade}.`
        : `O limite deve estar entre ${tipo.minimo} e ${tipo.maximo} ${tipo.unidade}.`;
    }
  }

  if (!errors.aviso && !errors.critico && aviso >= critico) {
    errors.critico = 'O limite crítico deve ser maior que o limite de aviso.';
  }

  return errors;
}

export function mapearErrosRegra(error: unknown): FormErrors {
  const errors: FormErrors = {};
  for (const [campo, mensagens] of Object.entries(obterErrosDeCampo(error))) {
    const chave = campo.toLowerCase().replace(/^\$\./, '');
    const mensagem = mensagens.join(' ');
    if (chave.endsWith('nome')) errors.nome = mensagem;
    else if (chave.endsWith('descricao')) errors.descricao = mensagem;
    else if (chave.endsWith('tiporegra')) errors.tipoRegra = mensagem;
    else if (chave.endsWith('aviso')) errors.aviso = mensagem;
    else if (chave.endsWith('critico')) errors.critico = mensagem;
    else if (chave.endsWith('parametros')) {
      errors.aviso = mensagem;
      errors.critico = mensagem;
    }
  }
  return errors;
}
