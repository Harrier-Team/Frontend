import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyableCodeProps {
  texto: string;
  /** Nome do que é copiado, para o rótulo do botão ("MAC do ESP"). */
  rotulo: string;
}

async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    // Contextos sem Clipboard API (http fora de localhost): cai no método antigo.
    try {
      const area = document.createElement('textarea');
      area.value = texto;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}

/** Texto em fonte mono com botão de copiar e confirmação para leitores de tela. */
export const CopyableCode: React.FC<CopyableCodeProps> = ({ texto, rotulo }) => {
  const [estado, setEstado] = useState<'ocioso' | 'copiado' | 'falhou'>('ocioso');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const copiar = async () => {
    setEstado((await copiarTexto(texto)) ? 'copiado' : 'falhou');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setEstado('ocioso'), 2000);
  };

  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-[var(--radius-control)] border border-line-strong bg-canvas py-0.5 pl-2.5 pr-0.5">
      <code className="truncate font-mono text-[13px] text-ink">{texto}</code>
      <button
        type="button"
        onClick={() => void copiar()}
        aria-label={`Copiar ${rotulo}`}
        title={`Copiar ${rotulo}`}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-raised hover:text-ink"
      >
        {estado === 'copiado' ? (
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        )}
      </button>
      <span role="status" className="sr-only">
        {estado === 'copiado' ? `${rotulo} copiado` : estado === 'falhou' ? 'Não foi possível copiar' : ''}
      </span>
    </span>
  );
};
