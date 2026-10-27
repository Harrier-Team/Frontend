import React, { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { IconButton } from './Button';

interface MenuItem {
  label: string;
  onSelect: () => void;
  tone?: 'default' | 'danger';
  icon?: React.ReactNode;
}

export const Menu: React.FC<{ label: string; items: MenuItem[] }> = ({ label, items }) => {
  const [open, setOpen] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  const botaoDoMenu = () => raiz.current?.querySelector<HTMLElement>('[aria-haspopup="menu"]') ?? null;
  const itensDoMenu = () => Array.from(raiz.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
  const fechar = (devolverFoco: boolean) => {
    setOpen(false);
    // O item some ao fechar: sem devolver o foco ao botão, ele cairia no <body>.
    if (devolverFoco) botaoDoMenu()?.focus();
  };

  useEffect(() => {
    if (!open) return;
    itensDoMenu()[0]?.focus();
    const fora = (event: MouseEvent) => {
      if (!raiz.current?.contains(event.target as Node)) setOpen(false);
    };
    const tecla = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        botaoDoMenu()?.focus();
        return;
      }
      if (event.key === 'Tab') {
        setOpen(false);
        return;
      }
      const itens = itensDoMenu();
      const atual = itens.indexOf(document.activeElement as HTMLElement);
      let alvo: number | null = null;
      if (event.key === 'ArrowDown') alvo = (atual + 1) % itens.length;
      else if (event.key === 'ArrowUp') alvo = (atual - 1 + itens.length) % itens.length;
      else if (event.key === 'Home') alvo = 0;
      else if (event.key === 'End') alvo = itens.length - 1;
      if (alvo === null) return;
      event.preventDefault();
      itens[alvo]?.focus();
    };
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', tecla);
    };
  }, [open]);

  return (
    <div ref={raiz} className="relative">
      <IconButton label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </IconButton>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-44 overflow-hidden rounded-xl border border-line-strong bg-raised p-1 shadow-[0_20px_40px_-12px_rgb(0_0_0/0.7)]"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                fechar(true);
                item.onSelect();
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-line ${
                item.tone === 'danger' ? 'text-sev-critico' : 'text-ink'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
