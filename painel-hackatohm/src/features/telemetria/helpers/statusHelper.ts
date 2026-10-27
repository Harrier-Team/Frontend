/**
 * Formatação de valores e horários. Não classifica nada: a severidade vem
 * sempre do backend (ver estadoHelper).
 */

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
