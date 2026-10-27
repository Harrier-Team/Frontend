import { useSyncExternalStore } from 'react';

let versao = 0;
const ouvintes = new Set<() => void>();

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

/** Avisa quem depende das regras vinculadas que elas mudaram. */
export function invalidarRegras(): void {
  versao += 1;
  ouvintes.forEach((ouvinte) => ouvinte());
}

export function useVersaoRegras(): number {
  return useSyncExternalStore(assinar, () => versao);
}
