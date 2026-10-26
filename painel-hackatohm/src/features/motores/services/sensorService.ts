import { api } from '@/services/api';
import { SensorInputWithMotor, SensorResponse } from '../types/motor';

export const sensorService = {
  async criar(payload: SensorInputWithMotor): Promise<SensorResponse> {
    const response = await api.post<SensorResponse>('/sensores', payload);
    return response.data;
  },

  async obterPorId(sensorId: string): Promise<SensorResponse> {
    const response = await api.get<SensorResponse>(
      `/sensores/${encodeURIComponent(sensorId)}`
    );
    return response.data;
  },
};
