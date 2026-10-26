import { useCallback, useEffect, useState } from 'react';
import { VinculoRegraQualidade } from '../../../types/regraQualidade';
import { vinculoRegraQualidadeService } from '../services/vinculoRegraQualidadeService';
import { obterMensagemErro } from '../../../utils/errorHelper';

export function useRegrasQualidadeMotor(motorId: number) {
  const [vinculos, setVinculos] = useState<VinculoRegraQualidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [operando, setOperando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setVinculos(await vinculoRegraQualidadeService.listarPorMotor(motorId));
    } catch (error) {
      setErro(obterMensagemErro(error, 'Não foi possível carregar os vínculos.'));
    } finally {
      setCarregando(false);
    }
  }, [motorId]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const associar = async (regraId: string) => {
    setOperando(true);
    setErro(null);
    try {
      const vinculo = await vinculoRegraQualidadeService.associar(motorId, regraId);
      setVinculos((anteriores) => [...anteriores, vinculo]);
      return vinculo;
    } catch (error) {
      setErro(obterMensagemErro(error, 'Não foi possível associar a regra.'));
      throw error;
    } finally {
      setOperando(false);
    }
  };

  const alternar = async (vinculo: VinculoRegraQualidade) => {
    setOperando(true);
    setErro(null);
    try {
      const atualizado = await vinculoRegraQualidadeService.atualizar(
        motorId,
        vinculo.regraQualidadeId,
        !vinculo.ativo
      );
      setVinculos((anteriores) =>
        anteriores.map((item) =>
          item.regraQualidadeId === atualizado.regraQualidadeId ? atualizado : item
        )
      );
      return atualizado;
    } catch (error) {
      setErro(obterMensagemErro(error, 'Não foi possível alterar o vínculo.'));
      throw error;
    } finally {
      setOperando(false);
    }
  };

  const remover = async (vinculo: VinculoRegraQualidade) => {
    setOperando(true);
    setErro(null);
    try {
      await vinculoRegraQualidadeService.remover(
        motorId,
        vinculo.regraQualidadeId
      );
      setVinculos((anteriores) =>
        anteriores.filter(
          (item) => item.regraQualidadeId !== vinculo.regraQualidadeId
        )
      );
    } catch (error) {
      setErro(obterMensagemErro(error, 'Não foi possível remover o vínculo.'));
      throw error;
    } finally {
      setOperando(false);
    }
  };

  return {
    vinculos,
    carregando,
    operando,
    erro,
    recarregar,
    associar,
    alternar,
    remover,
  };
}
