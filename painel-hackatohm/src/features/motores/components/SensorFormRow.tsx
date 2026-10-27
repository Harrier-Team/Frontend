import React from 'react';
import { Trash2 } from 'lucide-react';
import { EscovaForm } from '../types/motor';
import { IconButton } from '../../../components/ui/Button';

interface SensorFormRowProps {
  escova: EscovaForm;
  index: number;
  podeRemover: boolean;
  /** Número repetido em outra linha. */
  duplicada: boolean;
  onChange: <K extends keyof EscovaForm>(index: number, campo: K, valor: EscovaForm[K]) => void;
  onRemove: (index: number) => void;
}

export const SensorFormRow: React.FC<SensorFormRowProps> = ({
  escova,
  index,
  podeRemover,
  duplicada,
  onChange,
  onRemove,
}) => (
  <div className="grid grid-cols-[72px_minmax(0,1fr)_32px] items-end gap-3 p-3">
    <div>
      <label htmlFor={`escova-${index}`} className="field-label text-xs">
        Escova
      </label>
      <input
        id={`escova-${index}`}
        type="number"
        min="1"
        step="1"
        required
        aria-invalid={duplicada}
        value={escova.numeroEscova ?? ''}
        onChange={(event) =>
          onChange(
            index,
            'numeroEscova',
            event.target.value === '' ? null : Number(event.target.value)
          )
        }
        className="field num px-2 text-center"
      />
    </div>
    <div>
      <label htmlFor={`modelo-${index}`} className="field-label text-xs">
        Modelo do sensor
      </label>
      <input
        id={`modelo-${index}`}
        type="text"
        required
        placeholder="MLX90614"
        value={escova.modelo}
        onChange={(event) => onChange(index, 'modelo', event.target.value)}
        className="field"
      />
    </div>
    {podeRemover ? (
      <IconButton
        label={`Remover escova ${escova.numeroEscova ?? index + 1}`}
        onClick={() => onRemove(index)}
        className="mb-0.5"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </IconButton>
    ) : (
      <span />
    )}
  </div>
);
