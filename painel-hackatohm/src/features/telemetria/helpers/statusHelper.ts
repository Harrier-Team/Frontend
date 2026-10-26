import { NivelStatus, SensorComTelemetria } from '@/features/telemetria/types/telemetria';

export const LIMITE_ATENCAO = 60;
export const LIMITE_PERIGO = 80;
export const ESCALA_MAXIMA = 100;

export interface StatusConfig {
  label: string;
  /** Cor semântica (token CSS) usada em pontos, marcadores e valores. */
  color: string;
  /** Classe de texto para rótulos de estado. */
  textClass: string;
  /** Peso de ordenação: maior = mais urgente. */
  prioridade: number;
}

export const STATUS_THEME: Record<NivelStatus, StatusConfig> = {
  normal: { label: 'Estável', color: 'var(--color-ok)', textClass: 'text-ink-2', prioridade: 0 },
  warning: { label: 'Atenção', color: 'var(--color-warn)', textClass: 'text-warn', prioridade: 2 },
  perigo: { label: 'Crítico', color: 'var(--color-hot)', textClass: 'text-hot', prioridade: 3 },
  offline: { label: 'Sem sinal', color: 'var(--color-off)', textClass: 'text-ink-2', prioridade: 1 },
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

  if (alertaDesgaste || valorCelsius >= LIMITE_PERIGO) {
    return 'perigo';
  }

  if (valorCelsius >= LIMITE_ATENCAO) {
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


/**
 * Número no padrão brasileiro, sem unidade (ex.: 54,2).
 */
export function formatarGrau(temp?: number | null): string {
  if (temp === null || temp === undefined || isNaN(temp)) return '--';
  return temp.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/**
 * Tempo decorrido em linguagem curta (ex.: "agora", "há 12 s", "há 5 min").
 */
export function formatarRelativo(dataIso?: string | null, agora: number = Date.now()): string {
  if (!dataIso) return 'sem leitura';
  const diff = Math.max(0, Math.round((agora - new Date(dataIso).getTime()) / 1000));
  if (Number.isNaN(diff)) return 'sem leitura';
  if (diff < 5) return 'agora';
  if (diff < 60) return `há ${diff} s`;
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  return `há ${Math.floor(diff / 86400)} d`;
}

/** Ordena do mais urgente para o mais estável. */
export function compararPorUrgencia(a: NivelStatus, b: NivelStatus): number {
  return STATUS_THEME[b].prioridade - STATUS_THEME[a].prioridade;
}
