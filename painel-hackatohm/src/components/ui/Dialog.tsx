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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      // Foco no primeiro campo; sem campos, no botão marcado como seguro.
      el.querySelector<HTMLElement>('input, textarea, select, [data-autofocus]')?.focus();
    }
    if (!open && el.open) el.close();
    if (open) {
      const overflowAnterior = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = overflowAnterior; };
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
