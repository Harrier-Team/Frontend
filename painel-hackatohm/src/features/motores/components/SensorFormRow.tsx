import React from 'react';
import { Trash2 } from 'lucide-react';
import { SensorInput } from '../types/motor';
import { IconButton } from '../../../components/ui/Button';

interface SensorFormRowProps {
  sensor: SensorInput;
  index: number;
  podeRemover: boolean;
  onChange: <K extends keyof SensorInput>(index: number, campo: K, valor: SensorInput[K]) => void;
  onRemove: (index: number) => void;
}

export const SensorFormRow: React.FC<SensorFormRowProps> = ({
  sensor,
  index,
  podeRemover,
  onChange,
  onRemove,
}) => (
  <div className="grid grid-cols-[64px_minmax(0,1fr)] items-end gap-3 p-3 sm:grid-cols-[64px_minmax(0,1.4fr)_minmax(0,1fr)_32px]">
    <div>
      <label htmlFor={`escova-${index}`} className="field-label text-xs">
        Escova
      </label>
      <input
        id={`escova-${index}`}
        type="number"
        min="1"
        required
        value={sensor.numeroEscova}
        onChange={(event) => onChange(index, 'numeroEscova', Number(event.target.value) || 1)}
        className="field num px-2 text-center"
      />
    </div>
    <div>
      <label htmlFor={`mac-${index}`} className="field-label text-xs">
        MAC do ESP32
      </label>
      <input
        id={`mac-${index}`}
        type="text"
        required
        placeholder="AA:BB:CC:DD:EE:FF"
        value={sensor.macAddress}
        onChange={(event) => onChange(index, 'macAddress', event.target.value)}
        className="field num uppercase"
      />
    </div>
    <div className="col-span-2 sm:col-span-1">
      <label htmlFor={`modelo-${index}`} className="field-label text-xs">
        Modelo
      </label>
      <input
        id={`modelo-${index}`}
        type="text"
        required
        placeholder="MLX90614"
        value={sensor.modelo}
        onChange={(event) => onChange(index, 'modelo', event.target.value)}
        className="field"
      />
    </div>
    {podeRemover ? (
      <IconButton
        label={`Remover escova ${sensor.numeroEscova}`}
        onClick={() => onRemove(index)}
        className="col-start-2 justify-self-end sm:col-start-auto sm:mb-0.5"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </IconButton>
    ) : (
      <span className="hidden sm:block" />
    )}
  </div>
);
