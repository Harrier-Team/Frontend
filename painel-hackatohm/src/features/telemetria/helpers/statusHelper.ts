import { MotorComStatus, NivelStatus, SensorComTelemetria } from '@/features/telemetria/types/telemetria';
import type { ResultadoGateRealtime } from '@/features/quality-gates/types/qualityGate';
import { obterSeveridadeGate } from '@/features/quality-gates/helpers/qualityGateHelper';

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
  warning: { label: 'Atenção', color: 'var(--color-warn)', textClass: 'text-warn', prioridade: 3 },
  perigo: { label: 'Crítico', color: 'var(--color-hot)', textClass: 'text-hot', prioridade: 4 },
  sem_avaliacao: { label: 'Sem avaliação', color: 'var(--color-ink-3)', textClass: 'text-ink-3', prioridade: 2 },
  offline: { label: 'Sem sinal', color: 'var(--color-off)', textClass: 'text-ink-2', prioridade: 1 },
};

/**
 * Classifica a saúde térmica de uma escova individual
 */
export function classificarSensor(
  valorCelsius?: number | null,
  temConexao?: boolean,
  resultadosQualityGates?: ResultadoGateRealtime[] | null
): NivelStatus {
  if (valorCelsius === null || valorCelsius === undefined || !Number.isFinite(valorCelsius)) {
    return temConexao ? 'sem_avaliacao' : 'offline';
  }

  // Somente os resultados dos gates definem a saude termica. Temperatura e
  // conectividade, sozinhas, nao permitem afirmar que a operacao esta normal.
  if (Array.isArray(resultadosQualityGates) && resultadosQualityGates.length > 0) {
    const severidades = resultadosQualityGates.map(obterSeveridadeGate);
    if (severidades.includes('Critico')) {
      return 'perigo';
    }
    if (severidades.some((severidade) =>
      severidade === 'Atencao' || severidade === 'AlertaPreditivo'
    )) {
      return 'warning';
    }
    if (severidades.every((severidade) => severidade === 'Normal')) {
      return 'normal';
    }
  }

  return 'sem_avaliacao';
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
  if (sensores.some((s) => s.status === 'sem_avaliacao')) {
    return 'sem_avaliacao';
  }
  if (sensores.some((s) => s.status === 'normal')) {
    return 'normal';
  }

  return 'offline';
}

/** Deriva o estado exibido das leituras, inclusive das ja guardadas na pagina. */
export function reclassificarMotor(motor: MotorComStatus): MotorComStatus {
  const sensores = motor.sensores.map((sensor) => {
    const leitura = sensor.ultimaLeitura;
    if (!leitura) return sensor;
    const status = classificarSensor(leitura.valorCelsius, true, leitura.resultadosQualityGates);
    return status === sensor.status ? sensor : { ...sensor, status };
  });
  return {
    ...motor,
    sensores,
    statusGeral: calcularStatusGeralDoMotor(sensores),
    totalAlertas: sensores.filter((sensor) => sensor.status === 'perigo').length,
  };
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
