import { PrevisaoDaEscova } from './previsao';

/** Quanto o eixo X pode se estender para o futuro (e quanto a projeção pode avançar). */
export const LIMITE_EXTENSAO_MS = 30 * 60_000;

export interface PontoProjecao {
  /** ms desde a época. */
  t: number;
  /** °C. */
  v: number;
}

export interface Projecao {
  numeroEscova: number;
  severidade: PrevisaoDaEscova['severidade'];
  /** Valor da reta no lote: `temperaturaLimite − inclinação × minutos`. */
  inicio: PontoProjecao;
  /** Horário previsto no limite; se passar do teto de +30 min, o ponto em que o traço é cortado. */
  fim: PontoProjecao;
  limiteC: number;
  /** O traço foi cortado no teto de +30 min: o limite fica além do eixo. */
  truncada: boolean;
  /** Há segmento a desenhar (com 0 minutos a reta já passou do limite). */
  temSegmento: boolean;
}

/**
 * Segmento de projeção, derivado só de valores do backend: `valorObservado`
 * (minutos), `inclinacaoCelsiusPorMinuto` e `temperaturaLimite`. Parte do
 * valor da reta no lote e vai até (horário previsto, limite). O painel não
 * ajusta reta nenhuma. `fimDados` é o fim da janela de dados; a projeção
 * nunca passa de +30 min depois dele.
 */
export function projetarPrevisao(item: PrevisaoDaEscova, fimDados: number): Projecao | null {
  const t0 = Date.parse(item.dataHora);
  if (Number.isNaN(t0)) return null;
  const { minutos, inclinacao, limiteC } = item.previsao;
  const inicio: PontoProjecao = { t: t0, v: limiteC - inclinacao * minutos };

  if (minutos === 0) {
    // A reta já passou do limite: não há trajeto a desenhar, só a linha do limite.
    return {
      numeroEscova: item.numeroEscova,
      severidade: item.severidade,
      inicio: { t: t0, v: limiteC },
      fim: { t: t0, v: limiteC },
      limiteC,
      truncada: false,
      temSegmento: false,
    };
  }

  const tPrevisto = t0 + minutos * 60_000;
  const teto = Math.max(fimDados, t0) + LIMITE_EXTENSAO_MS;
  const truncada = tPrevisto > teto;
  const tFim = truncada ? teto : tPrevisto;
  const fim: PontoProjecao = truncada
    ? { t: tFim, v: inicio.v + inclinacao * ((tFim - t0) / 60_000) }
    : { t: tFim, v: limiteC };
  return {
    numeroEscova: item.numeroEscova,
    severidade: item.severidade,
    inicio,
    fim,
    limiteC,
    truncada,
    temSegmento: tFim > t0,
  };
}

/** Fim do eixo X: o fim dos dados, estendido até onde a projeção chega (no máximo +30 min). */
export function fimDoEixo(fimDados: number, projecoes: Projecao[]): number {
  const maior = projecoes.reduce((m, p) => Math.max(m, p.fim.t), fimDados);
  return Math.min(maior, fimDados + LIMITE_EXTENSAO_MS);
}

/** Linhas de limite sem repetição: uma por temperatura, na severidade mais grave entre as escovas. */
export function limitesPrevistos(projecoes: Projecao[]): Array<{ limiteC: number; severidade: Projecao['severidade'] }> {
  const rank: Record<string, number> = { Critico: 3, AlertaPreditivo: 2, Atencao: 1 };
  const mapa = new Map<number, Projecao['severidade']>();
  for (const p of projecoes) {
    const atual = mapa.get(p.limiteC);
    if (atual === undefined || (rank[p.severidade] ?? 0) > (rank[atual] ?? 0)) mapa.set(p.limiteC, p.severidade);
  }
  return [...mapa.entries()].map(([limiteC, severidade]) => ({ limiteC, severidade }));
}
