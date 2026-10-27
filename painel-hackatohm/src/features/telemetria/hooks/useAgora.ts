import { useSyncExternalStore } from 'react';

const INTERVALO_MS = 1000;
const ouvintes = new Set<() => void>();
let agora = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  if (!timer) {
    agora = Date.now();
    timer = setInterval(() => {
      agora = Date.now();
      ouvintes.forEach((fn) => fn());
    }, INTERVALO_MS);
  }
  return () => {
    ouvintes.delete(ouvinte);
    if (ouvintes.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function instante() {
  // Sem assinantes o relógio não anda; renova para a primeira renderização não usar hora velha.
  if (!timer && Date.now() - agora > INTERVALO_MS) agora = Date.now();
  return agora;
}

/** Relógio compartilhado (1 s) para idades como "há 4 s" e para o frescor. */
export function useAgora(): number {
  return useSyncExternalStore(assinar, instante);
}
