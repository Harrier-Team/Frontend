import React, { createContext, useContext } from 'react';
import { useMotores } from '../features/motores/hooks/useMotores';
import { useTelemetria } from './useTelemetria';

type MonitoramentoContextValue = ReturnType<typeof useMotores> &
  ReturnType<typeof useTelemetria>;

const MonitoramentoContext = createContext<MonitoramentoContextValue | null>(null);

export const MonitoramentoProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const motoresState = useMotores();
  const telemetriaState = useTelemetria(motoresState.motores);

  return (
    <MonitoramentoContext.Provider value={{ ...motoresState, ...telemetriaState }}>
      {children}
    </MonitoramentoContext.Provider>
  );
};

export function useMonitoramento(): MonitoramentoContextValue {
  const context = useContext(MonitoramentoContext);
  if (!context) {
    throw new Error('useMonitoramento deve ser usado dentro de MonitoramentoProvider.');
  }
  return context;
}
