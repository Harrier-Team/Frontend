import { signalRService } from '@/features/telemetria/services/signalrService';
import { alertaService } from '../services/alertaService';
import { criarAlertasStore, HubAlertas } from './criarAlertasStore';
import { criarReconhecimentos } from './criarReconhecimentos';

let hubAtivo: HubAlertas = signalRService;

/**
 * Troca a fonte de eventos dos alertas antes de a aplicação iniciar. Usado só
 * pelo simulador de desenvolvimento; em produção o hub é sempre o SignalR.
 */
export function definirHubAlertas(hub: HubAlertas): void {
  hubAtivo = hub;
}

/** Repassa ao hub vigente: a troca acontece antes de o store iniciar. */
const hubDelegado: HubAlertas = {
  onAlertaManutencao: (cb) => hubAtivo.onAlertaManutencao(cb),
  onStatusMotor: (cb) => hubAtivo.onStatusMotor(cb),
  onStatusMudou: (cb) => hubAtivo.onStatusMudou(cb),
};

/** Janela e aba voltaram a ficar à vista: a lista pode ter mudado sem evento (encerramentos). */
function aoVoltarFoco(callback: () => void): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => undefined;
  const aoVisivel = () => {
    if (document.visibilityState === 'visible') callback();
  };
  window.addEventListener('focus', callback);
  document.addEventListener('visibilitychange', aoVisivel);
  return () => {
    window.removeEventListener('focus', callback);
    document.removeEventListener('visibilitychange', aoVisivel);
  };
}

function obterLocalStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Instância única do painel. Os testes usam `criarAlertasStore` com dependências falsas. */
export const alertasStore = criarAlertasStore({
  listarAbertos: () => alertaService.listarAbertos(),
  hub: hubDelegado,
  aoVoltarFoco,
});

export const reconhecimentos = criarReconhecimentos(obterLocalStorage());
