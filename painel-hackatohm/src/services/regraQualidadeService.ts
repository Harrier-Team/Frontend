import { api } from './api';
import {
  RegraQualidade,
  RegraQualidadeRequest,
} from '../types/regraQualidade';

export const regraQualidadeService = {
  async listar(): Promise<RegraQualidade[]> {
    const response = await api.get<RegraQualidade[]>('/regras-qualidade');
    return response.data;
  },

  async obterPorId(id: string): Promise<RegraQualidade> {
    const response = await api.get<RegraQualidade>(`/regras-qualidade/${id}`);
    return response.data;
  },

  async criar(payload: RegraQualidadeRequest): Promise<RegraQualidade> {
    const response = await api.post<RegraQualidade>('/regras-qualidade', payload);
    return response.data;
  },

  async atualizar(
    id: string,
    payload: RegraQualidadeRequest
  ): Promise<RegraQualidade> {
    const response = await api.put<RegraQualidade>(
      `/regras-qualidade/${id}`,
      payload
    );
    return response.data;
  },

  async excluir(id: string): Promise<void> {
    await api.delete(`/regras-qualidade/${id}`);
  },
};
