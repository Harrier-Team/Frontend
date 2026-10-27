import { ParametrosRegra } from '@/features/quality-gates/types/regraQualidade';
import { TIPO_ASSIMETRIA, TIPO_GRADIENTE, TIPO_LIMIAR_ESTATICO } from '@/features/quality-gates/helpers/tiposRegra';
import { SerieEscova } from '../store/tipos';

/**
 * Medidas auxiliares para posicionar o valor atual numa escala de regra.
 * São leituras/cálculos de grandeza, nunca classificação: a severidade vem
 * sempre do backend.
 */

/** Variação em °C/min entre os dois últimos pontos da escova; null sem dois pontos ou sem intervalo. */
export function gradienteDaEscova(serie: SerieEscova | undefined): number | null {
  const pontos = serie?.pontos ?? [];
  if (pontos.length < 2) return null;
  const a = pontos[pontos.length - 2];
  const b = pontos[pontos.length - 1];
  const minutos = (b.t - a.t) / 60_000;
  return minutos > 0 ? (b.v - a.v) / minutos : null;
}

export interface ExtremosDoLote {
  maisQuente: { numeroEscova: number; valor: number };
  maisFria: { numeroEscova: number; valor: number };
  diferenca: number;
}

/** Escovas mais quente e mais fria entre as últimas leituras; null com menos de duas. */
export function extremosDoLote(escovas: Record<number, SerieEscova> | undefined): ExtremosDoLote | null {
  const itens = Object.entries(escovas ?? {})
    .map(([numero, serie]) => ({ numeroEscova: Number(numero), valor: serie.ultima?.valorCelsius }))
    .filter((i): i is { numeroEscova: number; valor: number } => typeof i.valor === 'number' && Number.isFinite(i.valor));
  if (itens.length < 2) return null;
  const maisQuente = itens.reduce((a, b) => (b.valor > a.valor ? b : a));
  const maisFria = itens.reduce((a, b) => (b.valor < a.valor ? b : a));
  return { maisQuente, maisFria, diferenca: maisQuente.valor - maisFria.valor };
}

/** Valor atual que a regra do tipo avalia hoje, para o marcador da escala. */
export function valorAtualDaRegra(
  tipoRegra: string,
  escovas: Record<number, SerieEscova> | undefined
): number | null {
  if (tipoRegra === TIPO_LIMIAR_ESTATICO) {
    const valores = Object.values(escovas ?? {})
      .map((s) => s.ultima?.valorCelsius)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    return valores.length > 0 ? Math.max(...valores) : null;
  }
  if (tipoRegra === TIPO_ASSIMETRIA) return extremosDoLote(escovas)?.diferenca ?? null;
  if (tipoRegra === TIPO_GRADIENTE) {
    const gradientes = Object.values(escovas ?? {})
      .map(gradienteDaEscova)
      .filter((v): v is number => v !== null);
    return gradientes.length > 0 ? Math.max(...gradientes) : null;
  }
  return null;
}

export interface EscalaRegra {
  min: number;
  max: number;
}

/**
 * Faixa visível da escala de uma regra: do zero (ou abaixo, se os limites são
 * negativos) até 25% acima do limite crítico, ampliada para caber o valor atual.
 */
export function escalaDaRegra(
  tipoRegra: string,
  parametros: ParametrosRegra,
  valor?: number | null
): EscalaRegra {
  const permiteNegativo = tipoRegra === TIPO_LIMIAR_ESTATICO;
  let min = permiteNegativo ? Math.min(0, Math.floor(parametros.aviso - 20)) : 0;
  let max = parametros.critico + Math.max(Math.abs(parametros.critico - parametros.aviso), Math.abs(parametros.critico) * 0.2);
  if (typeof valor === 'number' && Number.isFinite(valor)) {
    max = Math.max(max, valor + (max - min) * 0.05);
    if (permiteNegativo) min = Math.min(min, valor - 5);
  }
  if (!(max > min)) max = min + 1;
  return { min, max };
}

/** Posição (0 a 100) de um valor na escala, limitada às bordas. */
export function posicaoNaEscala(valor: number, escala: EscalaRegra): number {
  const p = ((valor - escala.min) / (escala.max - escala.min)) * 100;
  return Math.min(100, Math.max(0, p));
}
