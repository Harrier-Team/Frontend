import React from 'react';
import { Plus } from 'lucide-react';
import { EscovaForm } from '../types/motor';
import { SensorFormRow } from './SensorFormRow';
import { Button } from '../../../components/ui/Button';

interface SensorFormListProps {
  escovas: EscovaForm[];
  onChange: <K extends keyof EscovaForm>(index: number, campo: K, valor: EscovaForm[K]) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export const SensorFormList: React.FC<SensorFormListProps> = ({
  escovas,
  onChange,
  onAdd,
  onRemove,
}) => {
  const contagem = new Map<number | null, number>();
  escovas.forEach((escova) =>
    contagem.set(escova.numeroEscova, (contagem.get(escova.numeroEscova) ?? 0) + 1)
  );

  return (
    <fieldset className="min-w-0 border-0 p-0">
      <div className="mb-1 flex items-center justify-between">
        <legend className="float-left text-sm text-ink">
          Escovas<span className="num ml-2 text-ink-3">{escovas.length}</span>
        </legend>
        <Button size="sm" variant="ghost" onClick={onAdd} className="-mr-2">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Adicionar escova
        </Button>
      </div>
      <p className="clear-both mb-3 text-[13px] text-ink-3">
        O ESP deve enviar todas estas escovas em cada lote.
      </p>
      <div className="max-h-64 divide-y divide-line overflow-y-auto rounded-xl border border-line">
        {escovas.map((escova, index) => (
          <SensorFormRow
            key={index}
            escova={escova}
            index={index}
            podeRemover={escovas.length > 1}
            duplicada={
              escova.numeroEscova !== null && (contagem.get(escova.numeroEscova) ?? 0) > 1
            }
            onChange={onChange}
            onRemove={onRemove}
          />
        ))}
      </div>
    </fieldset>
  );
};
