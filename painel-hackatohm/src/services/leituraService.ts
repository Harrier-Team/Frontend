import { api } from './api';
import { LeituraMaisRecente } from '../types/telemetria';

export const leituraService = {
  async obterUltimaLeitura(
    espMacAddress: string,
    numeroEscova: number
  ): Promise<LeituraMaisRecente | null> {
    try {
      const response = await api.get<LeituraMaisRecente>('/leituras', {
        params: {
          espMacAddress: espMacAddress.trim().toUpperCase(),
          numeroEscova,
        },
      });
      return response.data;
    } catch (error: any) {
      // 404 significa que o sensor ainda não enviou telemetria
      if (error.response?.status === 404 || error.message?.includes('404')) {
        return null;
      }
      console.warn(`[Telemetria] Falha ao ler sensor ${espMacAddress} #${numeroEscova}:`, error.message);
      return null;
    }
  },

  extrairMacAddress(sensorId: string): string {
    if (!sensorId) return '';
    const parts = sensorId.split('_Escova');
    return parts[0].trim().toUpperCase();
  },
};

