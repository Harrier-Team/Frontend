import { useEffect, useSyncExternalStore } from 'react';
import { EstadoEventos } from '../store/criarRegistroEventos';
import { registroEventos } from '../store/registroEventos';
import { contarCriticosNaoVistos } from '../helpers/transicoes';

export function useEventosSessao(): EstadoEventos {
  return useSyncExternalStore(registroEventos.subscribe, registroEventos.obterEstado);
}

/** Transições para Crítico ainda não marcadas como vistas (contador do menu e da aba). */
export function useCriticosNaoVistos(): number {
  return useSyncExternalStore(registroEventos.subscribe, () => {
    const { eventos, vistoAte } = registroEventos.obterEstado();
    return contarCriticosNaoVistos(eventos, vistoAte);
  });
}

/** Liga o registro ao store de telemetria enquanto o painel estiver aberto. */
export function useRegistroEventos(): void {
  useEffect(() => registroEventos.iniciar(), []);
}
