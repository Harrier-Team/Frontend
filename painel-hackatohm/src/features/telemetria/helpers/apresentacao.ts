import { SEVERIDADE_THEME } from '@/features/quality-gates/helpers/qualityGateHelper';
import { EstadoDado, EstadoPrincipal } from './estadoHelper';
import { ParametrosRegra } from '@/features/quality-gates/types/regraQualidade';

export interface TemaEstado {
  label: string;
  /** Cor semântica (token CSS) para pontos, marcadores e valores. */
  color: string;
  textClass: string;
}

const neutro = (label: string): TemaEstado => ({
  label,
  color: 'var(--color-data-off)',
  textClass: 'text-ink-2',
});

/** Rótulo e cor de cada estado principal. Só severidade anormal usa cor de alerta. */
export const TEMA_ESTADO: Record<EstadoPrincipal, TemaEstado> = {
  Normal: SEVERIDADE_THEME.Normal,
  Atencao: SEVERIDADE_THEME.Atencao,
  AlertaPreditivo: SEVERIDADE_THEME.AlertaPreditivo,
  Critico: SEVERIDADE_THEME.Critico,
  offline: neutro('Offline'),
  degradado: neutro('Degradado'),
  'aguardando-amostras': neutro('Aguardando amostras'),
  'sem-regras': neutro('Sem regras'),
  'sem-leitura': neutro('Sem leitura'),
};

export const ROTULO_DADO: Record<EstadoDado, string> = {
  'ao-vivo': 'Ao vivo',
  atrasado: 'Atrasado',
  degradado: 'Degradado',
  offline: 'Offline',
  'sem-leitura': 'Sem leitura',
};

export interface EscalaGauge {
  min: number;
  max: number;
}

/**
 * Escala visual do medidor. Com limites da regra, a escala acompanha o limite
 * crítico; sem limites, é só um enquadramento (0 a 100 °C) para posicionar o
 * ponto, sem faixas nem valores inventados.
 */
export function escalaDoGauge(
  limites: ParametrosRegra | null | undefined,
  valor: number | null | undefined
): EscalaGauge {
  const v = typeof valor === 'number' && Number.isFinite(valor) ? valor : null;
  let min = 0;
  let max = 100;

  if (limites) {
    min = Math.min(0, Math.floor(limites.aviso / 10) * 10 - 10);
    max = Math.max(10, Math.ceil((limites.critico * 1.15) / 10) * 10);
  }
  if (v !== null) {
    min = Math.min(min, Math.floor(v / 10) * 10);
    max = Math.max(max, Math.ceil(v / 10) * 10);
  }
  return { min, max };
}
