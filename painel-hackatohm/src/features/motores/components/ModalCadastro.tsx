import React, { useState } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { MotorInput, MotorResponse } from '../types/motor';
import { MotorForm } from './MotorForm';
import { obterMensagemErro } from '../../../utils/errorHelper';

interface ModalCadastroProps {
  aberto: boolean;
  onFechar: () => void;
  onCadastrar: (dados: MotorInput) => Promise<MotorResponse>;
}

export const ModalCadastro: React.FC<ModalCadastroProps> = ({
  aberto,
  onFechar,
  onCadastrar,
}) => {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (dados: MotorInput) => {
    setErro(null);
    setSalvando(true);
    try {
      await onCadastrar(dados);
      setErro(null);
      onFechar();
    } catch (error: unknown) {
      setErro(obterMensagemErro(error, 'Não foi possível cadastrar o motor.'));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={aberto} title="Novo motor" onClose={onFechar} locked={salvando}>
      {aberto && <MotorForm salvando={salvando} erro={erro} onSubmit={handleSubmit} onCancel={onFechar} />}
    </Dialog>
  );
};
