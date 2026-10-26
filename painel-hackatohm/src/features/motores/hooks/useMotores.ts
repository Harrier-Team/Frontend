import { useState, useEffect, useCallback } from 'react';
import { MotorResponse, MotorInput } from '../types/motor';
import { motorService } from '../services/motorService';

export function useMotores() {
  const [motores, setMotores] = useState<MotorResponse[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarMotores = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const data = await motorService.listar();
      setMotores(data);
    } catch (err: any) {
      setErro(err.message || 'Falha ao buscar lista de motores');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarMotores();
  }, [carregarMotores]);

  const cadastrarMotor = async (payload: MotorInput): Promise<MotorResponse> => {
    const novoMotor = await motorService.criar(payload);
    await carregarMotores();
    return novoMotor;
  };

  const deletarMotor = async (id: number): Promise<void> => {
    await motorService.deletar(id);
    setMotores((anteriores) => anteriores.filter((m) => m.id !== id));
  };

  return {
    motores,
    carregando,
    erro,
    recarregar: carregarMotores,
    cadastrarMotor,
    deletarMotor,
  };
}
