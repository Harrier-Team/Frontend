import { createContext } from 'react';
import { useMotores } from '../features/motores/hooks/useMotores';
import { useTelemetria } from '@/features/telemetria/hooks/useTelemetria';

export type MonitoramentoContextValue = ReturnType<typeof useMotores> &
  ReturnType<typeof useTelemetria>;

export const MonitoramentoContext =
  createContext<MonitoramentoContextValue | null>(null);
