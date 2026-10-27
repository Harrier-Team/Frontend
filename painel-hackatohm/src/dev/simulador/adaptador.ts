import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { HubFalso } from './hubFalso';
import type { ServidorSimulado } from './servidor';

const LATENCIA_MS = 120;

function lerCorpo(config: InternalAxiosRequestConfig): unknown {
  if (typeof config.data !== 'string' || config.data === '') return config.data;
  try {
    return JSON.parse(config.data);
  } catch {
    return config.data;
  }
}

/**
 * Adaptador do axios que responde no lugar da rede, a partir do servidor
 * simulado. Todo o resto do painel (serviços, hooks, store) segue o caminho
 * normal; só o transporte muda.
 */
export function criarAdaptador(servidor: ServidorSimulado, hub: HubFalso): AxiosAdapter {
  return (config) =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        const caminho = (config.url ?? '').replace(/^\/api/, '');
        const metodo = config.method ?? 'get';
        const { status, data } = servidor.tratar(metodo, caminho, lerCorpo(config));

        const resposta: AxiosResponse = {
          data: data ?? '',
          status,
          statusText: String(status),
          headers: {},
          config,
        };

        // O primeiro status de um motor traz junto o histórico recente da simulação.
        const casamento = /^\/motores\/(\d+)\/status/.exec(caminho);
        if (casamento && status === 200) hub.entregarHistorico(Number(casamento[1]));

        if (status >= 200 && status < 300) {
          resolve(resposta);
        } else {
          reject(new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_REQUEST', config, null, resposta));
        }
      }, LATENCIA_MS);
    });
}
