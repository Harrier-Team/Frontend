import { api } from '@/services/api';
import { LeituraEscova, TelemetriaRealtimeDto } from '@/features/telemetria/types/telemetria';
import { normalizarLeituraRealtime } from '@/features/telemetria/helpers/normalizacao';
import { ApiRequestError } from '@/types/api';
import { telemetryRoutes } from './telemetryRoutes';

export const leituraService = {
  /**
   * Última leitura persistida de uma escova, com os gates reavaliados.
   * Retorna null quando o sensor ainda não enviou telemetria (404); outras
   * falhas são propagadas para que a tela não as confunda com "sem dados".
   */
  async obterUltimaLeitura(
    espMacAddress: string,
    numeroEscova: number
  ): Promise<LeituraEscova | null> {
    try {
      const response = await api.get<TelemetriaRealtimeDto>(telemetryRoutes.latestReading, {
        params: {
          espMacAddress: espMacAddress.trim().toUpperCase(),
          numeroEscova,
        },
      });
      return normalizarLeituraRealtime({ ...response.data, espMacAddress });
    } catch (error: unknown) {
      if (error instanceof ApiRequestError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },
};
