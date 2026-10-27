import React, { useState } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { MotorInput, MotorResponse } from '../types/motor';
import { MotorForm } from './MotorForm';
import { listarErrosDeCampo, obterMensagemErro } from '../../../utils/errorHelper';

interface ModalCadastroProps {
  aberto: boolean;
  onFechar: () => void;
  onCadastrar: (dados: MotorInput) => Promise<MotorResponse>;
  /** Depois de cadastrar e fechar: o chamador leva o usuário ao motor novo. */
  onConcluido?: (motor: MotorResponse, dados: MotorInput) => void;
}

export const ModalCadastro: React.FC<ModalCadastroProps> = ({
  aberto,
  onFechar,
  onCadastrar,
  onConcluido,
}) => {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [detalhes, setDetalhes] = useState<string[]>([]);

  const handleSubmit = async (dados: MotorInput) => {
    setErro(null);
    setDetalhes([]);
    setSalvando(true);
    try {
      const motor = await onCadastrar(dados);
      setErro(null);
      onFechar();
      onConcluido?.(motor, dados);
    } catch (error: unknown) {
      setErro(obterMensagemErro(error, 'Não foi possível cadastrar o motor.'));
      setDetalhes(listarErrosDeCampo(error));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={aberto} title="Novo motor" onClose={onFechar} locked={salvando}>
      {aberto && <MotorForm salvando={salvando} erro={erro} detalhesErro={detalhes} onSubmit={handleSubmit} onCancel={onFechar} />}
    </Dialog>
  );
};
