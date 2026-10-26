import React from 'react';
import { Plus } from 'lucide-react';
import { SensorInput } from '../types/motor';
import { SensorFormRow } from './SensorFormRow';

interface SensorFormListProps {
  sensores: SensorInput[];
  onChange: <K extends keyof SensorInput>(
    index: number,
    campo: K,
    valor: SensorInput[K]
  ) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export const SensorFormList: React.FC<SensorFormListProps> = ({
  sensores,
  onChange,
  onAdd,
  onRemove,
}) => (
  <section className="border-t border-slate-100 pt-4">
    <div className="mb-3 flex items-center justify-between">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Sensores ESP32 das Escovas ({sensores.length})
        </label>
        <p className="text-[11px] text-slate-500">
          Informe o MAC Address do ESP32 de cada escova monitorada
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Adicionar Escova</span>
      </button>
    </div>
    <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
      {sensores.map((sensor, index) => (
        <SensorFormRow
          key={`${sensor.numeroEscova}-${index}`}
          sensor={sensor}
          index={index}
          podeRemover={sensores.length > 1}
          onChange={onChange}
          onRemove={onRemove}
        />
      ))}
    </div>
  </section>
);
