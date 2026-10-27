import React, { useRef } from 'react';
import { idDaAba, idDoPainel } from './tabsIds';

export interface TabItem {
  id: string;
  rotulo: string;
  contagem?: number;
}

interface TabsProps {
  itens: TabItem[];
  valor: string;
  onChange: (id: string) => void;
  /** Nome acessível da lista de abas. */
  label: string;
  /** Prefixo dos ids: aba `${prefixo}-tab-${id}`, painel `${prefixo}-panel-${id}`. */
  prefixo: string;
}

/**
 * Abas acessíveis (padrão WAI-ARIA): setas, Home e End movem e ativam a aba;
 * só a aba ativa entra na ordem do Tab. O painel fica a cargo de quem usa,
 * com `role="tabpanel"` e `aria-labelledby` apontando para a aba.
 */
export const Tabs: React.FC<TabsProps> = ({ itens, valor, onChange, label, prefixo }) => {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const mover = (event: React.KeyboardEvent, indice: number) => {
    let alvo: number | null = null;
    if (event.key === 'ArrowRight') alvo = (indice + 1) % itens.length;
    else if (event.key === 'ArrowLeft') alvo = (indice - 1 + itens.length) % itens.length;
    else if (event.key === 'Home') alvo = 0;
    else if (event.key === 'End') alvo = itens.length - 1;
    if (alvo === null) return;
    event.preventDefault();
    const id = itens[alvo].id;
    onChange(id);
    refs.current[id]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className="-mx-5 flex gap-1 overflow-x-auto border-b border-line px-5 sm:mx-0 sm:gap-2 sm:px-0"
    >
      {itens.map((item, indice) => {
        const ativa = item.id === valor;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[item.id] = el;
            }}
            id={idDaAba(prefixo, item.id)}
            type="button"
            role="tab"
            aria-selected={ativa}
            aria-controls={idDoPainel(prefixo, item.id)}
            tabIndex={ativa ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => mover(event, indice)}
            className={`relative h-11 shrink-0 px-3 text-sm transition-colors after:absolute after:inset-x-3 after:bottom-[-1px] after:h-px after:transition-colors ${
              ativa ? 'text-ink after:bg-flare' : 'text-ink-2 after:bg-transparent hover:text-ink'
            }`}
          >
            {item.rotulo}
            {item.contagem !== undefined && (
              <span className="num ml-1.5 text-ink-3">{item.contagem}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
