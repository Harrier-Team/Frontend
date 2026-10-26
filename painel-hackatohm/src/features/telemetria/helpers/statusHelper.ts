import { NivelStatus, SensorComTelemetria } from '@/features/telemetria/types/telemetria';

export interface StatusConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accent: string;
  indicatorClass: string;
  cardBorderHighlight: string;
  description: string;
}

export const STATUS_THEME: Record<NivelStatus, StatusConfig> = {
  normal: {
    label: 'Normal',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    accent: '#10B981',
    indicatorClass: 'bg-emerald-500',
    cardBorderHighlight: 'border-l-4 border-l-emerald-500',
    description: 'Temperatura e sensores em níveis operacionais ideais.',
  },
  warning: {
    label: 'Atenção',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    accent: '#F59E0B',
    indicatorClass: 'bg-amber-500',
    cardBorderHighlight: 'border-l-4 border-l-amber-500',
    description: 'Temperatura moderadamente elevada ou sensor oscilando.',
  },
  perigo: {
    label: 'Desgaste / Perigo',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    accent: '#EF4444',
    indicatorClass: 'bg-rose-500 animate-pulse',
    cardBorderHighlight: 'border-l-4 border-l-rose-500 ring-1 ring-rose-300',
    description: 'Temperatura crítica (≥ 80°C) com risco de dano térmico.',
  },
  offline: {
    label: 'Sem Sinal',
    badgeBg: 'bg-slate-100 text-slate-600 border-slate-200',
    badgeText: 'text-slate-500',
    badgeBorder: 'border-slate-200',
    accent: '#94A3B8',
    indicatorClass: 'bg-slate-300',
    cardBorderHighlight: 'border-l-4 border-l-slate-300',
    description: 'Aguardando primeira leitura de telemetria.',
  },
};

/**
 * Classifica a saúde térmica de uma escova individual
 */
export function classificarSensor(
  valorCelsius?: number | null,
  alertaDesgaste?: boolean,
  temConexao?: boolean
): NivelStatus {
  if (valorCelsius === null || valorCelsius === undefined) {
    return temConexao ? 'normal' : 'offline';
  }

  if (alertaDesgaste || valorCelsius >= 80) {
    return 'perigo';
  }

  if (valorCelsius >= 60) {
    return 'warning';
  }

  return 'normal';
}

/**
 * Determina o status geral consolidado do motor
 * Regra: O motor assume o pior estado entre todas as suas escovas.
 */
export function calcularStatusGeralDoMotor(sensores: SensorComTelemetria[]): NivelStatus {
  if (!sensores || sensores.length === 0) return 'offline';

  if (sensores.some((s) => s.status === 'perigo')) {
    return 'perigo';
  }
  if (sensores.some((s) => s.status === 'warning')) {
    return 'warning';
  }
  if (sensores.some((s) => s.status === 'normal')) {
    return 'normal';
  }

  return 'offline';
}

/**
 * Formata um valor numérico em graus Celsius
 */
export function formatarTemperatura(temp?: number | null): string {
  if (temp === null || temp === undefined || isNaN(temp)) return '--';
  return `${temp.toFixed(1)} °C`;
}

/**
 * Formata timestamps para formato amigável (ex: '14:32:05' ou 'há 10s')
 */
export function formatarHora(dataIso?: string | null): string {
  if (!dataIso) return 'Nunca';
  try {
    const data = new Date(dataIso);
    return data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return 'Data inválida';
  }
}

