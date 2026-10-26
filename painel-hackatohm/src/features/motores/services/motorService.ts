import { api } from '../../../services/api';
import { MotorResponse, MotorInput } from '../types/motor';

export const motorService = {
  async listar(): Promise<MotorResponse[]> {
    const response = await api.get<MotorResponse[]>('/motores');
    return response.data;
  },

  async obterPorId(id: number): Promise<MotorResponse> {
    const response = await api.get<MotorResponse>(`/motores/${id}`);
    return response.data;
  },

  async criar(payload: MotorInput): Promise<MotorResponse> {
    const response = await api.post<MotorResponse>('/motores', payload);
    return response.data;
  },

  async deletar(id: number): Promise<void> {
    await api.delete(`/motores/${id}`);
  },
};
