import { ParametrosRegra } from '@/features/quality-gates/types/regraQualidade';

/**
 * Validação dos parâmetros de regra, como o backend faz (RegraQualidadeValidators):
 * uma única mensagem para `Parametros`. Serve para o simulador devolver 400
 * quando o painel manda um corpo que o backend recusaria, por exemplo
 * `temperaturaLimite` ou `janela` num tipo que não é a previsão por tendência.
 */
const TIPOS = [
  'temperatura.limiar_estatico',
  'temperatura.gradiente_termico',
  'temperatura.assimetria_escovas',
  'temperatura.previsao_tendencia',
];

const finito = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function validarParametros(tipoRegra: string, parametros: Partial<ParametrosRegra> | null | undefined): string | null {
  if (!TIPOS.includes(tipoRegra)) {
    return 'O tipo de regra deve ser limiar estático, gradiente térmico, assimetria entre escovas ou previsão por tendência.';
  }
  const mensagem =
    'Os parâmetros devem ser finitos e respeitar os limites do tipo de regra: aviso menor que crítico; na previsão por tendência, aviso e crítico são minutos (aviso maior que crítico) e a temperatura limite é obrigatória.';
  if (!parametros || !finito(parametros.aviso) || !finito(parametros.critico)) return mensagem;
  const { aviso, critico, temperaturaLimite, janela } = parametros;

  if (tipoRegra === 'temperatura.previsao_tendencia') {
    const janelaValida =
      janela === undefined || janela === null || (Number.isInteger(janela) && janela >= 5 && janela <= 60);
    const valido =
      critico > 0 &&
      aviso > critico &&
      finito(temperaturaLimite) &&
      temperaturaLimite >= -55 &&
      temperaturaLimite <= 200 &&
      janelaValida;
    return valido ? null : mensagem;
  }

  // Nos outros tipos, os campos da previsão são rejeitados.
  const semExtras =
    (temperaturaLimite === undefined || temperaturaLimite === null) && (janela === undefined || janela === null);
  const faixa =
    tipoRegra === 'temperatura.limiar_estatico'
      ? aviso >= -55 && aviso <= 200 && critico >= -55 && critico <= 200
      : aviso >= 0 && critico >= 0;
  return aviso < critico && faixa && semExtras ? null : mensagem;
}
