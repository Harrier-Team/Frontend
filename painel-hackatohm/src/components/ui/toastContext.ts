import { createContext, useContext } from 'react';

export type TomToast = 'info' | 'atencao' | 'critico';

export interface ToastEntrada {
  titulo: string;
  mensagem?: string;
  tom?: TomToast;
  /** Rota ou ação opcional exibida como link. */
  acao?: { rotulo: string; aoClicar: () => void };
}

export interface ToastItem extends ToastEntrada {
  id: number;
  tom: TomToast;
}

export interface ToastApi {
  mostrar: (entrada: ToastEntrada) => number;
  fechar: (id: number) => void;
}

export const TEMPO_TOAST_MS = 8000;

/** Aviso some em 8 s, exceto Crítico, que fica até ser dispensado. */
export function duracaoDoToast(tom: TomToast): number | null {
  return tom === 'critico' ? null : TEMPO_TOAST_MS;
}

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast deve ser usado dentro de ToastProvider.');
  return api;
}
