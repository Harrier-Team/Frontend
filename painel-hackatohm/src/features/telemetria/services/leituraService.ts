import { api } from '@/services/api';
import { LeituraMaisRecente } from '@/features/telemetria/types/telemetria';
import { ApiRequestError } from '@/types/api';
import { telemetryRoutes } from './telemetryRoutes';
import type { ResultadoGateRecebido } from '@/features/quality-gates/types/qualityGate';
import { normalizarResultadosQualityGates } from '@/features/quality-gates/helpers/qualityGateHelper';

interface UltimaLeituraApiResponse extends Omit<LeituraMaisRecente, 'resultadosQualityGates'> {
  resultadosQualityGates?: ResultadoGateRecebido[] | null;
}

export const leituraService = {
  async obterUltimaLeitura(
    espMacAddress: string,
    numeroEscova: number
  ): Promise<LeituraMaisRecente | null> {
    try {
      const response = await api.get<UltimaLeituraApiResponse>(
        telemetryRoutes.latestReading,
        {
        params: {
          espMacAddress: espMacAddress.trim().toUpperCase(),
          numeroEscova,
        },
        }
      );
      return {
        ...response.data,
        resultadosQualityGates: normalizarResultadosQualityGates(response.data.resultadosQualityGates),
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
