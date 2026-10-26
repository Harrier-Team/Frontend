import React, { useState } from 'react';
import { Cpu, X } from 'lucide-react';
import { MotorInput, MotorResponse } from '../types/motor';
import { MotorForm } from './motores/MotorForm';
import { validarMotorForm } from '../hooks/useMotorForm';
import { obterMensagemErro } from '../utils/errorHelper';

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

  if (!aberto) return null;

  const handleSubmit = async (dados: MotorInput) => {
    const erroValidacao = validarMotorForm(
      dados.nome,
      dados.tipo,
      dados.sensoresIniciais
    );
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center space-x-2">
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Cpu className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Novo Motor</h2>
              <p className="text-xs text-slate-500">
                Cadastre o motor e vincule os sensores ESP32 das escovas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            disabled={salvando}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar cadastro de motor"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <MotorForm
          salvando={salvando}
          erro={erro}
          onSubmit={handleSubmit}
          onCancel={onFechar}
        />
      </div>
    </div>
  );
};
