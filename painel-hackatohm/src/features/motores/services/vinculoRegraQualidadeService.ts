import { api } from '../../../services/api';
import { VinculoRegraQualidade } from '../../../types/regraQualidade';

function validarVinculo(
  vinculo: VinculoRegraQualidade,
  contexto: string
): VinculoRegraQualidade {
  if (
    !vinculo ||
    !vinculo.regra ||
    !vinculo.regra.parametros ||
    typeof vinculo.regra.nome !== 'string'
  ) {
    throw new Error(
      `A API retornou um vínculo de regra incompleto ao ${contexto}.`
    );
  }
  return vinculo;
}

export const vinculoRegraQualidadeService = {
  async listarPorMotor(motorId: number): Promise<VinculoRegraQualidade[]> {
    const response = await api.get<VinculoRegraQualidade[]>(
      `/motores/${motorId}/regras-qualidade`
    );
    return response.data.map((vinculo) =>
      validarVinculo(vinculo, 'listar regras do motor')
    );
  },

  async obter(
    motorId: number,
    regraId: string
  ): Promise<VinculoRegraQualidade> {
    const response = await api.get<VinculoRegraQualidade>(
      `/motores/${motorId}/regras-qualidade/${regraId}`
    );
    return validarVinculo(response.data, 'obter vínculo');
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
    return validarVinculo(response.data, 'associar regra');
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
    return validarVinculo(response.data, 'atualizar vínculo');
  },

  async remover(motorId: number, regraId: string): Promise<void> {
    await api.delete(`/motores/${motorId}/regras-qualidade/${regraId}`);
  },
};
