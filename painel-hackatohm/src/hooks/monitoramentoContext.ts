import { createContext } from 'react';
import { useMotores } from '../features/motores/hooks/useMotores';

export type MonitoramentoContextValue = ReturnType<typeof useMotores>;

export const MonitoramentoContext =
  createContext<MonitoramentoContextValue | null>(null);
