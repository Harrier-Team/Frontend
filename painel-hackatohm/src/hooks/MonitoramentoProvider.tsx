import React from 'react';
import { useMotores } from '../features/motores/hooks/useMotores';
import { useSincronizarTelemetria } from '@/features/telemetria/hooks/useTelemetriaStore';
import { MonitoramentoContext } from './monitoramentoContext';

export const MonitoramentoProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const motoresState = useMotores();
  useSincronizarTelemetria(motoresState.motores);

  return (
    <MonitoramentoContext.Provider value={motoresState}>
      {children}
    </MonitoramentoContext.Provider>
  );
};
