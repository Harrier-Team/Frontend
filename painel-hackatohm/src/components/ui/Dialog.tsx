import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './Button';

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Impede fechar enquanto uma operação está em andamento. */
  locked?: boolean;
}

/** Modal baseado em <dialog>: foco preso, Esc e backdrop nativos. */
export const Dialog: React.FC<DialogProps> = ({ open, title, onClose, children, locked }) => {
  const ref = useRef<HTMLDialogElement>(null);
  // Quem tinha o foco antes de abrir: é para onde ele volta ao fechar.
  const origem = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      origem.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      el.showModal();
      // Foco no primeiro campo; sem campos, no botão marcado como seguro.
      el.querySelector<HTMLElement>('input, textarea, select, [data-autofocus]')?.focus();
    }
    if (!open && el.open) {
      el.close();
      // O navegador já restaura o foco; isto cobre o caso de ele ter se perdido.
      const destino = origem.current;
      origem.current = null;
      if (destino?.isConnected && document.activeElement !== destino) destino.focus();
    }
  }, [open]);

  if (!open) return <dialog ref={ref} className="sheet" />;

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!locked) onClose();
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !locked) onClose();
      }}
    >
      <div className="flex items-center justify-between px-6 pt-5">
        <h2 id="dialog-title" className="display text-lg">
          {title}
        </h2>
        <IconButton label="Fechar" onClick={onClose} disabled={locked}>
          <X className="h-4 w-4" aria-hidden="true" />
        </IconButton>
      </div>
      {children}
    </dialog>
  );
};
