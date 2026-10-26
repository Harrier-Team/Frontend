import { api } from './api';
import { VinculoRegraQualidade } from '../types/regraQualidade';

export const vinculoRegraQualidadeService = {
  async listarPorMotor(motorId: number): Promise<VinculoRegraQualidade[]> {
    const response = await api.get<VinculoRegraQualidade[]>(
      `/motores/${motorId}/regras-qualidade`
    );
    return response.data;
  },

  async obter(
    motorId: number,
    regraId: string
  ): Promise<VinculoRegraQualidade> {
    const response = await api.get<VinculoRegraQualidade>(
      `/motores/${motorId}/regras-qualidade/${regraId}`
    );
    return response.data;
  },

  async associar(
    motorId: number,
    regraId: string,
    ativo = true
  ): Promise<VinculoRegraQualidade> {
    const response = await api.post<VinculoRegraQualidade>(
      `/motores/${motorId}/regras-qualidade/${regraId}`,
      { ativo }
    );
    return response.data;
  },

  async atualizar(
    motorId: number,
    regraId: string,
    ativo: boolean
  ): Promise<VinculoRegraQualidade> {
    const response = await api.put<VinculoRegraQualidade>(
      `/motores/${motorId}/regras-qualidade/${regraId}`,
      { ativo }
    );
    return response.data;
  },

  async remover(motorId: number, regraId: string): Promise<void> {
    await api.delete(`/motores/${motorId}/regras-qualidade/${regraId}`);
  },
};
