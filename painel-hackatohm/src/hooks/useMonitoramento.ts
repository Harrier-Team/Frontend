import { useContext } from 'react';
import {
  MonitoramentoContext,
  MonitoramentoContextValue,
} from './monitoramentoContext';

export function useMonitoramento(): MonitoramentoContextValue {
  const context = useContext(MonitoramentoContext);
  if (!context) {
    throw new Error('useMonitoramento deve ser usado dentro de MonitoramentoProvider.');
  }
  return context;
}
