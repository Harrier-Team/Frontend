import React, { useRef } from 'react';

export interface SegmentoItem<T extends string> {
  id: T;
  rotulo: string;
  contagem?: number;
}

interface SegmentedProps<T extends string> {
  itens: Array<SegmentoItem<T>>;
  valor: T;
  onChange: (id: T) => void;
  label: string;
  className?: string;
}

/**
 * Seleção única em linha (filtros, janelas do gráfico). Padrão radiogroup:
 * setas movem e selecionam, só o item ativo entra na ordem do Tab.
 */
export function Segmented<T extends string>({
  itens,
  valor,
  onChange,
  label,
  className = '',
}: SegmentedProps<T>) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const mover = (event: React.KeyboardEvent, indice: number) => {
    let alvo: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') alvo = (indice + 1) % itens.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
      alvo = (indice - 1 + itens.length) % itens.length;
    else if (event.key === 'Home') alvo = 0;
    else if (event.key === 'End') alvo = itens.length - 1;
    if (alvo === null) return;
    event.preventDefault();
    onChange(itens[alvo].id);
    refs.current[itens[alvo].id]?.focus();
  };

  return (
    <div role="radiogroup" aria-label={label} className={`flex flex-wrap gap-1 ${className}`}>
      {itens.map((item, indice) => {
        const ativo = item.id === valor;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[item.id] = el;
            }}
            type="button"
            role="radio"
            aria-checked={ativo}
            tabIndex={ativo ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => mover(event, indice)}
            className={`h-8 rounded-[var(--radius-control)] px-3 text-[13px] transition-colors ${
              ativo ? 'bg-raised text-ink' : 'text-ink-2 hover:text-ink'
            }`}
          >
            {item.rotulo}
            {item.contagem !== undefined && <span className="num ml-1.5 text-ink-3">{item.contagem}</span>}
          </button>
        );
      })}
    </div>
  );
}
