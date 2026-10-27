import { useCallback, useSyncExternalStore } from 'react';
import { alternarTema, COR_DO_NAVEGADOR, salvarTema, Tema } from './temaHelper';

const ouvintes = new Set<() => void>();

/** A fonte de verdade é o atributo no `<html>`, que o script do `index.html` já definiu. */
function temaAtual(): Tema {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

function aplicar(tema: Tema) {
  if (tema === 'light') document.documentElement.setAttribute('data-theme', 'light');
  else document.documentElement.removeAttribute('data-theme');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COR_DO_NAVEGADOR[tema]);
  salvarTema(() => window.localStorage, tema);
  ouvintes.forEach((ouvinte) => ouvinte());
}

export function useTema(): { tema: Tema; alternar: () => void } {
  const tema = useSyncExternalStore(assinar, temaAtual, () => 'dark' as Tema);
  const alternar = useCallback(() => aplicar(alternarTema(temaAtual())), []);
  return { tema, alternar };
}
