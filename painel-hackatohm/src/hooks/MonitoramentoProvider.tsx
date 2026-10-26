import React from 'react';
import { useMotores } from '../features/motores/hooks/useMotores';
import { useTelemetria } from '@/features/telemetria/hooks/useTelemetria';
import { MonitoramentoContext } from './monitoramentoContext';

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
