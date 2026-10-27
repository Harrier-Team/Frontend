import { api } from '@/services/api';
import { mapearSaude, ResultadoSaude } from '../helpers/saude';

function lerCorpo(dados: unknown): unknown {
  if (typeof dados !== 'string') return dados;
  const texto = dados.trim();
  if (texto.startsWith('{') || texto.startsWith('[')) {
    try {
      return JSON.parse(texto);
    } catch {
      return texto;
    }
  }
  return texto;
}

async function consultar(rota: string): Promise<ResultadoSaude> {
  try {
    // Fora de `/api`: os health checks ficam na raiz do servidor. 503 é resposta, não erro.
    const resposta = await api.get(rota, {
      baseURL: '',
      timeout: 5000,
      responseType: 'text',
      transformResponse: [(dados: unknown) => dados],
      validateStatus: () => true,
    });
    return mapearSaude(resposta.status, lerCorpo(resposta.data));
  } catch {
    return mapearSaude(null, null);
  }
}

export const saudeService = {
  /** A aplicação está viva e a fila disponível. */
  live: () => consultar('/health/live'),
  /** PostgreSQL e fila prontos para receber tráfego. */
  ready: () => consultar('/health/ready'),
};
