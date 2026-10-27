/**
 * Geometria do anel coletor esquemático. As posições NÃO são medidas: os
 * porta-escovas são espalhados igualmente pelo anel, na ordem do número da
 * escova (escova 1 no topo, sentido horário). Nada aqui indica onde um sensor
 * está de fato.
 */

export interface PontoAnel {
  x: number;
  y: number;
}

export interface PosicaoEscova extends PontoAnel {
  numeroEscova: number;
  /** Graus, sentido horário a partir do topo (0° = topo). */
  angulo: number;
}

/** Ponto do círculo; ângulo em graus, 0° no topo, crescendo no sentido horário. */
export function pontoNoAnel(cx: number, cy: number, raio: number, angulo: number): PontoAnel {
  const rad = (angulo * Math.PI) / 180;
  return { x: cx + raio * Math.sin(rad), y: cy - raio * Math.cos(rad) };
}

/**
 * Posição de cada porta-escova: distribuição igual pela ordem do número da
 * escova. Números repetidos viram uma só posição.
 */
export function posicoesDasEscovas(
  numeros: number[],
  cx: number,
  cy: number,
  raio: number
): PosicaoEscova[] {
  const ordenados = [...new Set(numeros)].sort((a, b) => a - b);
  return ordenados.map((numeroEscova, indice) => {
    const angulo = (indice * 360) / ordenados.length;
    return { numeroEscova, angulo, ...pontoNoAnel(cx, cy, raio, angulo) };
  });
}

export interface ArcoAnel {
  /** Atributo `d` do `<path>`: sempre o arco mais curto entre os dois pontos. */
  d: string;
  inicio: PontoAnel;
  fim: PontoAnel;
  /** Abertura do arco, em graus (0 a 180). */
  abertura: number;
  /** true = percorrido no sentido horário. */
  horario: boolean;
}

/** Arco mais curto do anel entre dois ângulos (empate em 180°: sentido horário). */
export function arcoMaisCurto(
  cx: number,
  cy: number,
  raio: number,
  anguloA: number,
  anguloB: number
): ArcoAnel {
  const delta = (((anguloB - anguloA) % 360) + 360) % 360;
  const horario = delta <= 180;
  const inicio = pontoNoAnel(cx, cy, raio, anguloA);
  const fim = pontoNoAnel(cx, cy, raio, anguloB);
  const abertura = horario ? delta : 360 - delta;
  const f = (n: number) => n.toFixed(2);
  return {
    d: `M${f(inicio.x)} ${f(inicio.y)} A${raio} ${raio} 0 0 ${horario ? 1 : 0} ${f(fim.x)} ${f(fim.y)}`,
    inicio,
    fim,
    abertura,
    horario,
  };
}

/** Próxima escova na ordem, com volta; `passo` +1 ou -1. Sem seleção, a primeira (ou a última). */
export function escovaVizinha(numeros: number[], atual: number | null, passo: 1 | -1): number | null {
  const ordenados = [...new Set(numeros)].sort((a, b) => a - b);
  if (ordenados.length === 0) return null;
  const indice = atual === null ? -1 : ordenados.indexOf(atual);
  if (indice === -1) return passo === 1 ? ordenados[0] : ordenados[ordenados.length - 1];
  return ordenados[(indice + passo + ordenados.length) % ordenados.length];
}
