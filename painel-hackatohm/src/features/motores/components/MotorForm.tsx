import React from 'react';
import { MotorInput } from '../types/motor';
import { SensorFormList } from './SensorFormList';
import { useMotorForm } from '../hooks/useMotorForm';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';

interface MotorFormProps {
  salvando: boolean;
  erro: string | null;
  onSubmit: (dados: MotorInput) => Promise<void>;
  onCancel: () => void;
}

export const MotorForm: React.FC<MotorFormProps> = ({ salvando, erro, onSubmit, onCancel }) => {
  const form = useMotorForm();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(form.criarPayload());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 px-6 pb-6 pt-5">
      {erro && <Alert tone="error" title={erro} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="motor-nome" className="field-label">
            Nome
          </label>
          <input
            id="motor-nome"
            type="text"
            required
            autoFocus
            placeholder="Motor trastejador 01"
            value={form.nome}
            onChange={(event) => form.setNome(event.target.value)}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="motor-tipo" className="field-label">
            Tipo
          </label>
          <input
            id="motor-tipo"
            type="text"
            required
            placeholder="Trifásico 220 V"
            value={form.tipo}
            onChange={(event) => form.setTipo(event.target.value)}
            className="field"
          />
        </div>
      </div>

      <SensorFormList
        sensores={form.sensores}
        onChange={form.atualizarSensor}
        onAdd={form.adicionarSensor}
        onRemove={form.removerSensor}
      />

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={salvando}>
          Cancelar
        </Button>
        <Button type="submit" busy={salvando}>
          {salvando ? 'Salvando' : 'Salvar motor'}
        </Button>
      </div>
    </form>
  );
};
