/**
 * Cenários térmicos do simulador de desenvolvimento. Funções puras do tempo:
 * o mesmo instante sempre dá a mesma temperatura, o que permite preencher o
 * histórico recente de forma consistente com o que vem depois.
 */

export type PerfilTermico =
  | 'aquecimento'
  | 'aquecimento-lento'
  | 'normal'
  | 'critico'
  | 'silencioso'
  | 'sem-regras'
  | 'novo';

/** Ciclo do aquecimento: sobe 8 min, mantém 2 min, esfria 4 min. */
export const CICLO_AQUECIMENTO_S = 840;
const SUBIDA_S = 480;
const PLATO_S = 120;

/**
 * Ruído suave (duas senoides lentas): a inclinação máxima fica abaixo de
 * 1 °C/min, então escovas normais nunca disparam o gradiente por ruído.
 */
function ruido(s: number, escova: number): number {
  return 0.2 * Math.sin(s / 23 + escova * 1.7) + 0.08 * Math.sin(s / 11 + escova * 0.6);
}

/** Fração (0 a 1) do aquecimento no instante `s`: sobe, mantém e esfria. */
export function fracaoAquecimento(s: number): number {
  const fase = ((s % CICLO_AQUECIMENTO_S) + CICLO_AQUECIMENTO_S) % CICLO_AQUECIMENTO_S;
  if (fase < SUBIDA_S) return fase / SUBIDA_S;
  if (fase < SUBIDA_S + PLATO_S) return 1;
  return 1 - (fase - SUBIDA_S - PLATO_S) / (CICLO_AQUECIMENTO_S - SUBIDA_S - PLATO_S);
}

/**
 * Aquecimento lento (plano B da demonstração): a escova 2 sobe 1,8 °C/min por
 * ~27 min, de 50 a 98 °C, segura e esfria. A previsão para 95 °C dispara
 * minutos antes de o limite estático de aviso (80 °C) ser alcançado.
 */
export const CICLO_LENTO_S = 2400;
const SUBIDA_LENTA_S = 1600;
const PLATO_LENTO_S = 100;
const TAXA_LENTA_C_POR_S = 0.03;

/** Temperatura da escova que aquece devagar no instante `s` (sem ruído). */
export function temperaturaAquecimentoLento(s: number): number {
  const fase = ((s % CICLO_LENTO_S) + CICLO_LENTO_S) % CICLO_LENTO_S;
  const topo = 50 + TAXA_LENTA_C_POR_S * SUBIDA_LENTA_S;
  if (fase < SUBIDA_LENTA_S) return 50 + TAXA_LENTA_C_POR_S * fase;
  if (fase < SUBIDA_LENTA_S + PLATO_LENTO_S) return topo;
  return topo - ((fase - SUBIDA_LENTA_S - PLATO_LENTO_S) / (CICLO_LENTO_S - SUBIDA_LENTA_S - PLATO_LENTO_S)) * (topo - 50);
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
    case 'aquecimento-lento':
      // A escova que aquece sobe sem ruído: com a inclinação limpa, a estimativa desce de forma
      // contínua e o alerta não abre e fecha ao redor do horizonte. As outras escovas têm ruído.
      if (numeroEscova === 2) return temperaturaAquecimentoLento(s);
      return 52 + numeroEscova + 0.1 * (temperaturaAquecimentoLento(s) - 50) + n * 0.5;
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
/** Cadência padrão dos lotes simulados (mais rápida que a real, de ~10 s, para a demonstração). */
export const CADENCIA_SIMULADA_MS = 3000;
/** Quanto de histórico é gerado ao abrir o painel. */
export const HISTORICO_INICIAL_S = 180;
