import type { RegraQualidade, RegraQualidadeRequest } from '../types/regraQualidade';
import { tipoRegraSuportado } from './tipoRegraHelper';

export function criarPayloadAtualizacao(
  regra: RegraQualidade, ativo = regra.ativo
): RegraQualidadeRequest {
  if (!tipoRegraSuportado(regra.tipoRegra)) {
    throw new Error('Atualize o painel para editar este tipo de regra.');
  }
  return {
    nome: regra.nome, descricao: regra.descricao, tipoRegra: regra.tipoRegra,
    parametros: { ...regra.parametros }, ativo,
  };
}
