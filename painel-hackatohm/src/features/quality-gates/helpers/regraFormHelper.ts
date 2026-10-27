import type { RegraQualidade, RegraQualidadeRequest } from '../types/regraQualidade';
import type { RegraQualidadeFormValues } from './validationHelper';
import { tipoRegraSuportado } from './tipoRegraHelper';

export function criarValoresFormulario(regra?: RegraQualidade | null): RegraQualidadeFormValues {
  return {
    nome: regra?.nome ?? '', descricao: regra?.descricao ?? '',
    tipoRegra: regra?.tipoRegra ?? 'temperatura.limiar_estatico',
    parametros: { aviso: regra?.parametros?.aviso ?? Number.NaN,
      critico: regra?.parametros?.critico ?? Number.NaN },
    ativo: regra?.ativo ?? true,
  };
}

export function trocarTipoFormulario(
  valores: RegraQualidadeFormValues, tipoRegra: string
): RegraQualidadeFormValues {
  return { ...valores, tipoRegra, parametros: { aviso: Number.NaN, critico: Number.NaN } };
}

export function criarPayloadFormulario(values: RegraQualidadeFormValues): RegraQualidadeRequest {
  if (!tipoRegraSuportado(values.tipoRegra)) throw new Error('Tipo de regra não suportado.');
  return {
    nome: values.nome.trim(), descricao: values.descricao.trim() || null,
    tipoRegra: values.tipoRegra, parametros: { ...values.parametros }, ativo: values.ativo,
  };
}
