import { api } from '@/services/api';
import {
  RegraQualidade,
  RegraQualidadeRequest,
} from '@/features/quality-gates/types/regraQualidade';
import { qualityGateRoutes } from './qualityGateRoutes';

export const regraQualidadeService = {
  async listar(): Promise<RegraQualidade[]> {
    const response = await api.get<RegraQualidade[]>(
      qualityGateRoutes.collection
    );
    return response.data;
  },

  async obterPorId(id: string): Promise<RegraQualidade> {
    const response = await api.get<RegraQualidade>(
      qualityGateRoutes.byId(id)
    );
    return response.data;
  },

  async criar(payload: RegraQualidadeRequest): Promise<RegraQualidade> {
    const response = await api.post<RegraQualidade>(
      qualityGateRoutes.collection,
      payload
    );
    return response.data;
  },

  async atualizar(
    id: string,
    payload: RegraQualidadeRequest
  ): Promise<RegraQualidade> {
    const response = await api.put<RegraQualidade>(
      qualityGateRoutes.byId(id),
      payload
    );
    return response.data;
  },

  async excluir(id: string): Promise<void> {
    await api.delete(qualityGateRoutes.byId(id));
  },
};
