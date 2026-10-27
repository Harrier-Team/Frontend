/**
 * Cenários térmicos do simulador de desenvolvimento. Funções puras do tempo:
 * o mesmo instante sempre dá a mesma temperatura, o que permite preencher o
 * histórico recente de forma consistente com o que vem depois.
 */

export type PerfilTermico = 'aquecimento' | 'normal' | 'critico' | 'silencioso' | 'sem-regras' | 'novo';

/** Ciclo do aquecimento: sobe 8 min, mantém 2 min, esfria 4 min. */
export const CICLO_AQUECIMENTO_S = 840;
const SUBIDA_S = 480;
const PLATO_S = 120;

function ruido(s: number, escova: number): number {
  return 0.25 * Math.sin(s / 17 + escova * 1.7) + 0.12 * Math.sin(s / 9 + escova * 0.6);
}

/** Fração (0 a 1) do aquecimento no instante `s`: sobe, mantém e esfria. */
export function fracaoAquecimento(s: number): number {
  const fase = ((s % CICLO_AQUECIMENTO_S) + CICLO_AQUECIMENTO_S) % CICLO_AQUECIMENTO_S;
  if (fase < SUBIDA_S) return fase / SUBIDA_S;
  if (fase < SUBIDA_S + PLATO_S) return 1;
  return 1 - (fase - SUBIDA_S - PLATO_S) / (CICLO_AQUECIMENTO_S - SUBIDA_S - PLATO_S);
}

/** Temperatura em °C da escova no instante `s` (segundos do relógio da simulação). */
export function temperaturaSimulada(perfil: PerfilTermico, numeroEscova: number, s: number): number {
  const n = ruido(s, numeroEscova);
  switch (perfil) {
    case 'aquecimento': {
      const f = fracaoAquecimento(s);
      // A escova 2 aquece forte; as vizinhas acompanham de leve (condução).
      if (numeroEscova === 2) return 57 + 41 * f + n;
      return 55 + (numeroEscova === 1 ? 1 : 0.5) + 3 * f + n;
    }
    case 'critico':
      return numeroEscova === 2 ? 97.4 + 1.2 * Math.sin(s / 23) + n : 62 + numeroEscova + n;
    case 'silencioso':
      return 57 + numeroEscova + 4 * Math.sin(s / 90) + n;
    case 'sem-regras':
      return 46 + numeroEscova + 2 * Math.sin(s / 60) + n;
    case 'novo':
      return 38 + numeroEscova * 1.5 + n;
    case 'normal':
    default:
      return 48 + numeroEscova * 1.2 + 1.5 * Math.sin(s / 75) + n;
  }
}

/** Instante (s) a partir do qual o motor silencioso para de enviar, contado da instalação. */
export const SILENCIO_APOS_S = 90;
/** Atraso para um motor recém-cadastrado começar a enviar lotes. */
export const PRIMEIRO_LOTE_APOS_S = 9;
/** Cadência dos lotes simulados. */
export const CADENCIA_SIMULADA_MS = 3000;
/** Quanto de histórico é gerado ao abrir o painel. */
export const HISTORICO_INICIAL_S = 180;
