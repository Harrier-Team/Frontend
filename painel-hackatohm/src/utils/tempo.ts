/**
 * Formatação de tempo em minutos, sem relógio nem contagem regressiva por
 * segundo: estimativa não finge precisão.
 */

function partes(minutos: number): { horas: number; resto: number } {
  const total = Math.max(1, Math.round(minutos));
  return { horas: Math.floor(total / 60), resto: total % 60 };
}

/** "8 min", "1 h 20 min", "2 h". Usado para durações (sem til). */
export function formatarDuracaoMinutos(minutos: number): string {
  if (!Number.isFinite(minutos) || minutos < 0) return '—';
  if (minutos < 1) return 'menos de 1 min';
  const { horas, resto } = partes(minutos);
  if (horas === 0) return `${resto} min`;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

/**
 * Estimativa em minutos: "~8 min", "~1 h 20 min" e "agora" para 0 (a reta já
 * passou do limite). Valor ausente ou inválido vira "—".
 */
export function formatarMinutos(minutos: number | null | undefined): string {
  if (minutos === null || minutos === undefined || !Number.isFinite(minutos) || minutos < 0) return '—';
  if (minutos === 0) return 'agora';
  if (minutos < 1) return 'menos de 1 min';
  return `~${formatarDuracaoMinutos(minutos)}`;
}

/**
 * Horário previsto ("14:38"): `dataHora` do lote mais os minutos estimados.
 * Ancorado no lote, o horário continua correto entre lotes sem recalcular
 * nada no cliente. `fusoHorario` existe para os testes.
 */
export function formatarHorarioPrevisto(
  dataHoraIso: string | null | undefined,
  minutos: number | null | undefined,
  fusoHorario?: string
): string | null {
  if (!dataHoraIso || minutos === null || minutos === undefined || !Number.isFinite(minutos) || minutos < 0) {
    return null;
  }
  const base = Date.parse(dataHoraIso);
  if (Number.isNaN(base)) return null;
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: fusoHorario,
  }).format(base + minutos * 60_000);
}
