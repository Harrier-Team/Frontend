/** Logs de diagnóstico: só aparecem no modo de desenvolvimento. */
export function logDev(...args: unknown[]): void {
  if (import.meta.env.DEV) console.info(...args);
}
