import { api } from '@/services/api';
import { LeituraMaisRecente } from '@/features/telemetria/types/telemetria';
import { ApiRequestError } from '@/types/api';

interface UltimaLeituraApiResponse {
  sensorId: string;
  valorCelsius: number;
  dataHora: string;
  alertaDesgaste: boolean;
}

export const leituraService = {
  async obterUltimaLeitura(
    espMacAddress: string,
    numeroEscova: number
  ): Promise<LeituraMaisRecente | null> {
    try {
      const response = await api.get<UltimaLeituraApiResponse>('/leituras', {
        params: {
          espMacAddress: espMacAddress.trim().toUpperCase(),
          numeroEscova,
        },
      });
      return {
        ...response.data,
        resultadosQualityGates: [],
      };
    } catch (error: unknown) {
      // 404 significa que o sensor ainda não enviou telemetria
      if (error instanceof ApiRequestError && error.status === 404) {
        return null;
      }
      const message = error instanceof Error ? error.message : 'erro desconhecido';
      console.warn(
        `[Telemetria] Falha ao ler sensor ${espMacAddress} #${numeroEscova}:`,
        message
      );
      return null;
    }
  },

  extrairMacAddress(sensorId: string): string {
    if (!sensorId) return '';
    const parts = sensorId.split('_Escova');
    return parts[0].trim().toUpperCase();
  },
};
