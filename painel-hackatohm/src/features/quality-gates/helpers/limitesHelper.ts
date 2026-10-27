import { ParametrosRegra, VinculoRegraQualidade } from '@/features/quality-gates/types/regraQualidade';
import { TIPO_LIMIAR_ESTATICO, TIPO_PREVISAO } from './tiposRegra';

/**
 * Limites do medidor de temperatura de um motor: os da regra de limiar
 * estático vinculada e ativa (vínculo e regra). Havendo mais de uma, vale a de
 * menor limite crítico, a mais conservadora. Sem regra, retorna null e o
 * medidor não desenha faixas.
 */
export function limitesDoLimiarEstatico(
  vinculos: VinculoRegraQualidade[] | null | undefined
): ParametrosRegra | null {
  const candidatos = (vinculos ?? [])
    .filter((v) => v.ativo && v.regra?.ativo && v.regra.tipoRegra === TIPO_LIMIAR_ESTATICO)
    .map((v) => v.regra.parametros)
    .filter((p) => Number.isFinite(p?.aviso) && Number.isFinite(p?.critico));

  if (candidatos.length === 0) return null;
  return candidatos.reduce((menor, atual) => (atual.critico < menor.critico ? atual : menor));
}

/**
 * Parâmetros das regras de previsão por tendência vinculadas e ativas do
 * motor (vínculo e regra), com a temperatura limite válida. Servem ao texto
 * calmo do cartão "Previsão": o backend não manda estimativa quando está Normal.
 */
export function regrasDePrevisaoAtivas(
  vinculos: VinculoRegraQualidade[] | null | undefined
): Array<ParametrosRegra & { temperaturaLimite: number }> {
  return (vinculos ?? [])
    .filter((v) => v.ativo && v.regra?.ativo && v.regra.tipoRegra === TIPO_PREVISAO)
    .map((v) => v.regra.parametros)
    .filter(
      (p): p is ParametrosRegra & { temperaturaLimite: number } =>
        typeof p?.temperaturaLimite === 'number' && Number.isFinite(p.temperaturaLimite) && Number.isFinite(p.aviso)
    );
}
