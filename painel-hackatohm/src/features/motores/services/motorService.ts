import { api } from '@/services/api';
import { MotorResponse, MotorInput } from '../types/motor';
import { motorRoutes } from './motorRoutes';

export const motorService = {
  async listar(): Promise<MotorResponse[]> {
    const response = await api.get<MotorResponse[]>(motorRoutes.collection);
    return response.data;
  },

  async obterPorId(id: number): Promise<MotorResponse> {
    const response = await api.get<MotorResponse>(motorRoutes.byId(id));
    return response.data;
  },

  async criar(payload: MotorInput): Promise<MotorResponse> {
    const response = await api.post<MotorResponse>(
      motorRoutes.collection,
      payload
    );
    return response.data;
  },

  async deletar(id: number): Promise<void> {
    await api.delete(motorRoutes.byId(id));
  },

  async pingarSensor(sensorId: string): Promise<void> {
    await api.post(motorRoutes.sensorPing(sensorId));
  },
};
