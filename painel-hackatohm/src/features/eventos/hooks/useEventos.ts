import { useEffect, useSyncExternalStore } from 'react';
import { EstadoEventos } from '../store/criarRegistroEventos';
import { registroEventos } from '../store/registroEventos';

export function useEventosSessao(): EstadoEventos {
  return useSyncExternalStore(registroEventos.subscribe, registroEventos.obterEstado);
}

/** Liga o registro ao store de telemetria enquanto o painel estiver aberto. */
export function useRegistroEventos(): void {
  useEffect(() => registroEventos.iniciar(), []);
}
