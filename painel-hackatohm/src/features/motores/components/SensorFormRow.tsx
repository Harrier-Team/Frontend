import React from 'react';
import { Trash2 } from 'lucide-react';
import { SensorInput } from '../types/motor';

interface SensorFormRowProps {
  sensor: SensorInput;
  index: number;
  podeRemover: boolean;
  onChange: <K extends keyof SensorInput>(
    index: number,
    campo: K,
    valor: SensorInput[K]
  ) => void;
  onRemove: (index: number) => void;
}

export const SensorFormRow: React.FC<SensorFormRowProps> = ({
  sensor,
  index,
  podeRemover,
  onChange,
  onRemove,
}) => (
  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs sm:flex-nowrap">
    <div className="w-16">
      <label className="mb-0.5 block text-[10px] font-semibold text-slate-500">
        Escova #
      </label>
      <input
        type="number"
        min="1"
        required
        value={sensor.numeroEscova}
        onChange={(event) =>
          onChange(index, 'numeroEscova', Number(event.target.value) || 1)
        }
        className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-center font-bold"
      />
    </div>
    <div className="min-w-[140px] flex-1">
      <label className="mb-0.5 block text-[10px] font-semibold text-slate-500">
        MAC Address ESP32
      </label>
      <input
        type="text"
        required
        placeholder="AA:BB:CC:DD:EE:FF"
        value={sensor.macAddress}
        onChange={(event) => onChange(index, 'macAddress', event.target.value)}
        className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 font-mono uppercase"
      />
    </div>
    <div className="min-w-[120px] flex-1">
      <label className="mb-0.5 block text-[10px] font-semibold text-slate-500">
        Modelo do Sensor
      </label>
      <input
        type="text"
        required
        placeholder="Ex: DS18B20"
        value={sensor.modelo}
        onChange={(event) => onChange(index, 'modelo', event.target.value)}
        className="w-full rounded border border-slate-300 bg-white px-2 py-1.5"
      />
    </div>
    {podeRemover && (
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="mt-4 rounded p-1.5 text-slate-400 transition hover:bg-white hover:text-rose-600 sm:mt-3"
        title="Remover esta escova"
        aria-label={`Remover escova ${sensor.numeroEscova}`}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    )}
  </div>
);
