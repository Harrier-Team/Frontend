import React from 'react';
import { Plus } from 'lucide-react';
import { SensorInput } from '../types/motor';
import { SensorFormRow } from './SensorFormRow';
import { Button } from '../../../components/ui/Button';

interface SensorFormListProps {
  sensores: SensorInput[];
  onChange: <K extends keyof SensorInput>(index: number, campo: K, valor: SensorInput[K]) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export const SensorFormList: React.FC<SensorFormListProps> = ({
  sensores,
  onChange,
  onAdd,
  onRemove,
}) => (
  <fieldset className="min-w-0 border-0 p-0">
    <div className="mb-3 flex items-center justify-between">
      <legend className="float-left text-sm text-ink">
        Escovas<span className="num ml-2 text-ink-3">{sensores.length}</span>
      </legend>
      <Button size="sm" variant="ghost" onClick={onAdd} className="-mr-2">
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Adicionar escova
      </Button>
    </div>
    <div className="clear-both max-h-64 divide-y divide-line overflow-y-auto rounded-xl border border-line">
      {sensores.map((sensor, index) => (
        <SensorFormRow
          key={index}
          sensor={sensor}
          index={index}
          podeRemover={sensores.length > 1}
          onChange={onChange}
          onRemove={onRemove}
        />
      ))}
    </div>
  </fieldset>
);
