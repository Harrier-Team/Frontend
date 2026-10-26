import React from 'react';
import { MotorInput } from '../types/motor';
import { SensorFormList } from './SensorFormList';
import { useMotorForm } from '../hooks/useMotorForm';

interface MotorFormProps {
  salvando: boolean;
  erro: string | null;
  onSubmit: (dados: MotorInput) => Promise<void>;
  onCancel: () => void;
}

export const MotorForm: React.FC<MotorFormProps> = ({
  salvando,
  erro,
  onSubmit,
  onCancel,
}) => {
  const form = useMotorForm();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(form.criarPayload());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-6">
      {erro && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
          {erro}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Nome do Motor *
          <input
            type="text"
            required
            placeholder="Ex: Motor Trastejador #01"
            value={form.nome}
            onChange={(event) => form.setNome(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal normal-case tracking-normal outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Tipo / Categoria *
          <input
            type="text"
            required
            placeholder="Ex: Trifásico 220V"
            value={form.tipo}
            onChange={(event) => form.setTipo(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal normal-case tracking-normal outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
        </label>
      </div>
      <SensorFormList
        sensores={form.sensores}
        onChange={form.atualizarSensor}
        onAdd={form.adicionarSensor}
        onRemove={form.removerSensor}
      />
      <div className="flex justify-end space-x-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={salvando}
          className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {salvando ? 'Cadastrando...' : 'Salvar Motor'}
        </button>
      </div>
    </form>
  );
};
