import { PontoEscova } from '@/features/telemetria/store/tipos';
import { ehSeveridadeAnormal } from './estadoHelper';

/** Cadência de referência do ESP (~10 s). */
export const CADENCIA_REFERENCIA_MS = 10_000;
/** Lacunas maiores que 3x a cadência quebram a linha. */
export const FATOR_LACUNA = 3;
/** Margem em °C acima do maior valor (ou do limite crítico) e abaixo do menor. */
export const MARGEM_Y = 5;

export type JanelaGrafico = '5min' | '15min' | 'sessao';

export const JANELAS: Array<{ id: JanelaGrafico; rotulo: string; ms: number | null }> = [
  { id: '5min', rotulo: '5 min', ms: 5 * 60_000 },
  { id: '15min', rotulo: '15 min', ms: 15 * 60_000 },
  { id: 'sessao', rotulo: 'Sessão', ms: null },
];

/** Mediana dos intervalos entre pontos consecutivos; sem pontos suficientes, a cadência de referência. */
export function cadenciaMediana(pontos: Array<{ t: number }>): number {
  if (pontos.length < 2) return CADENCIA_REFERENCIA_MS;
  const intervalos: number[] = [];
  for (let i = 1; i < pontos.length; i += 1) {
    const dt = pontos[i].t - pontos[i - 1].t;
    if (dt > 0) intervalos.push(dt);
  }
  if (intervalos.length === 0) return CADENCIA_REFERENCIA_MS;
  intervalos.sort((a, b) => a - b);
  const meio = Math.floor(intervalos.length / 2);
  return intervalos.length % 2 === 1
    ? intervalos[meio]
    : (intervalos[meio - 1] + intervalos[meio]) / 2;
}

/** Pontos dentro da janela [inicio, fim]. */
export function recortarJanela<T extends { t: number }>(pontos: T[], inicio: number, fim: number): T[] {
  return pontos.filter((p) => p.t >= inicio && p.t <= fim);
}

/**
 * Divide a série em segmentos contínuos: um intervalo maior que `FATOR_LACUNA`
 * vezes a cadência quebra a linha (nunca se interpola sobre silêncio).
 */
export function dividirEmSegmentos<T extends { t: number }>(
  pontos: T[],
  cadenciaMs: number = cadenciaMediana(pontos)
): T[][] {
  const limite = FATOR_LACUNA * Math.max(cadenciaMs, 1000);
  const segmentos: T[][] = [];
  let atual: T[] = [];
  for (const ponto of pontos) {
    const anterior = atual[atual.length - 1];
    if (anterior && ponto.t - anterior.t > limite) {
      segmentos.push(atual);
      atual = [];
    }
    atual.push(ponto);
  }
  if (atual.length > 0) segmentos.push(atual);
  return segmentos;
}

/**
 * Reduz pontos só para o desenho. Cada bucket mantém o mínimo e o máximo
 * (picos preservados) e todo ponto de alerta; primeiro e último são sempre
 * mantidos. O resultado continua ordenado por tempo.
 */
export function reduzirPontos(pontos: PontoEscova[], maximo: number): PontoEscova[] {
  if (pontos.length <= maximo || maximo < 4) return pontos;

  const buckets = Math.max(1, Math.floor((maximo - 2) / 2));
  const tamanho = pontos.length / buckets;
  const manter = new Set<number>([0, pontos.length - 1]);

  for (let b = 0; b < buckets; b += 1) {
    const ini = Math.floor(b * tamanho);
    const fim = Math.min(pontos.length, Math.floor((b + 1) * tamanho));
    if (ini >= fim) continue;
    let iMin = ini;
    let iMax = ini;
    for (let i = ini; i < fim; i += 1) {
      if (pontos[i].v < pontos[iMin].v) iMin = i;
      if (pontos[i].v > pontos[iMax].v) iMax = i;
      if (ehSeveridadeAnormal(pontos[i].severidade)) manter.add(i);
    }
    manter.add(iMin);
    manter.add(iMax);
  }

  return [...manter].sort((a, b) => a - b).map((i) => pontos[i]);
}

export interface EscalaY {
  min: number;
  max: number;
  ticks: number[];
}

function passoAgradavel(intervalo: number, alvo: number): number {
  const bruto = intervalo / Math.max(alvo, 1);
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const fracao = bruto / potencia;
  const base = fracao <= 1 ? 1 : fracao <= 2 ? 2 : fracao <= 5 ? 5 : 10;
  return base * potencia;
}

/**
 * Escala do eixo Y em °C: 5 °C de margem acima do maior valor ou do limite
 * crítico, e abaixo do menor valor. Sem dados, enquadra o limite ou 0 a 100.
 */
export function calcularEscalaY(valores: number[], limiteCritico?: number | null): EscalaY {
  const finitos = valores.filter(Number.isFinite);
  const topo = Math.max(...finitos, ...(limiteCritico != null ? [limiteCritico] : []));
  const base = finitos.length > 0 ? Math.min(...finitos) : null;

  let max = Number.isFinite(topo) ? topo + MARGEM_Y : 100;
  let min = base !== null ? base - MARGEM_Y : Math.max(0, max - 100);
  if (max - min < 20) {
    const centro = (max + min) / 2;
    max = centro + 10;
    min = centro - 10;
  }

  const passo = passoAgradavel(max - min, 5);
  const minAlinhado = Math.floor(min / passo) * passo;
  const maxAlinhado = Math.ceil(max / passo) * passo;
  const ticks: number[] = [];
  for (let v = minAlinhado; v <= maxAlinhado + passo / 2; v += passo) ticks.push(Math.round(v * 100) / 100);
  return { min: minAlinhado, max: maxAlinhado, ticks };
}

const PASSOS_X_MS = [
  5_000, 10_000, 15_000, 30_000, 60_000, 120_000, 300_000, 600_000, 900_000, 1_800_000, 3_600_000,
];

/** Instantes (ms) alinhados a um passo "redondo" dentro de [inicio, fim], no máximo ~`alvo` marcas. */
export function calcularTicksX(inicio: number, fim: number, alvo: number): number[] {
  if (!(fim > inicio)) return [];
  const passo =
    PASSOS_X_MS.find((p) => (fim - inicio) / p <= Math.max(alvo, 1)) ??
    PASSOS_X_MS[PASSOS_X_MS.length - 1];
  const ticks: number[] = [];
  for (let t = Math.ceil(inicio / passo) * passo; t <= fim; t += passo) ticks.push(t);
  return ticks;
}

export interface SerieGrafico {
  numeroEscova: number;
  pontos: PontoEscova[];
}

export interface Lote {
  t: number;
  /** Valor de cada escova neste instante (ausente quando a escova não tem ponto nele). */
  valores: Record<number, { v: number; severidade: PontoEscova['severidade'] }>;
  /** Maior menos menor valor entre as escovas do lote; null com menos de duas. */
  deltaT: number | null;
}

/** Agrupa os pontos das escovas por instante: um lote por `t`, em ordem. */
export function montarLotes(series: SerieGrafico[]): Lote[] {
  const porInstante = new Map<number, Lote['valores']>();
  for (const serie of series) {
    for (const ponto of serie.pontos) {
      const valores = porInstante.get(ponto.t) ?? {};
      valores[serie.numeroEscova] = { v: ponto.v, severidade: ponto.severidade };
      porInstante.set(ponto.t, valores);
    }
  }
  return [...porInstante.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, valores]) => {
      const vs = Object.values(valores).map((x) => x.v);
      return { t, valores, deltaT: vs.length >= 2 ? Math.max(...vs) - Math.min(...vs) : null };
    });
}

/** Índice do lote mais próximo de `t` (lotes ordenados); -1 se vazio. */
export function loteProximo(lotes: Lote[], t: number): number {
  if (lotes.length === 0) return -1;
  let baixo = 0;
  let alto = lotes.length - 1;
  while (alto - baixo > 1) {
    const meio = (baixo + alto) >> 1;
    if (lotes[meio].t <= t) baixo = meio;
    else alto = meio;
  }
  return Math.abs(lotes[baixo].t - t) <= Math.abs(lotes[alto].t - t) ? baixo : alto;
}

/**
 * Diminui a densidade de marcadores de alerta: mantém o primeiro, toda troca de
 * severidade e pontos com pelo menos `distanciaMinima` px do último marcador.
 */
export function afinarMarcadores(
  pontos: PontoEscova[],
  posicaoX: (t: number) => number,
  distanciaMinima: number
): PontoEscova[] {
  const resultado: PontoEscova[] = [];
  let ultimoX = -Infinity;
  let ultimaSeveridade: PontoEscova['severidade'] = null;
  for (const ponto of pontos) {
    if (!ehSeveridadeAnormal(ponto.severidade)) continue;
    const x = posicaoX(ponto.t);
    if (ponto.severidade !== ultimaSeveridade || x - ultimoX >= distanciaMinima) {
      resultado.push(ponto);
      ultimoX = x;
      ultimaSeveridade = ponto.severidade;
    }
  }
  return resultado;
}

/** Caminho SVG de uma linha; `pontos` já em coordenadas de tela. */
export function caminhoLinha(pontos: Array<{ x: number; y: number }>): string {
  return pontos
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
}

/**
 * Coordenadas da sparkline. Um mínimo de 6 °C de amplitude evita que ruído de
 * sensor pareça uma subida forte. Mais de `maximo` valores são reduzidos
 * por pico e vale.
 */
export function pontosSparkline(
  valores: number[],
  largura: number,
  altura: number,
  margem: number,
  maximo = 60
): Array<{ x: number; y: number }> {
  const finitos = valores.filter(Number.isFinite);
  if (finitos.length === 0) return [];
  const reduzidos = reduzirPontos(
    finitos.map((v, i) => ({ t: i, v, severidade: null })),
    maximo
  );
  const vs = reduzidos.map((p) => p.v);
  let min = Math.min(...vs);
  let max = Math.max(...vs);
  if (max - min < 6) {
    const centro = (max + min) / 2;
    min = centro - 3;
    max = centro + 3;
  }
  const ultimoIndice = Math.max(finitos.length - 1, 1);
  return reduzidos.map((p) => ({
    x: margem + (p.t / ultimoIndice) * (largura - 2 * margem),
    y: margem + (1 - (p.v - min) / (max - min)) * (altura - 2 * margem),
  }));
}
