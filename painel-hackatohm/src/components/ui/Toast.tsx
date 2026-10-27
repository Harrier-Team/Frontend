import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Info, OctagonAlert, TriangleAlert, X } from 'lucide-react';
import { IconButton } from './Button';
import {
  duracaoDoToast,
  ToastApi,
  ToastContext,
  ToastEntrada,
  ToastItem,
  TomToast,
} from './toastContext';

const COR: Record<TomToast, string> = {
  info: 'var(--color-ink-2)',
  atencao: 'var(--color-sev-atencao)',
  critico: 'var(--color-sev-critico)',
};
const ICONE = { info: Info, atencao: TriangleAlert, critico: OctagonAlert } as const;

const ItemToast: React.FC<{ item: ToastItem; onFechar: (id: number) => void }> = ({ item, onFechar }) => {
  const Icone = ICONE[item.tom];
  useEffect(() => {
    const duracao = duracaoDoToast(item.tom);
    if (duracao === null) return;
    const timer = setTimeout(() => onFechar(item.id), duracao);
    return () => clearTimeout(timer);
  }, [item.id, item.tom, onFechar]);

  return (
    <div
      className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line-strong bg-raised px-4 py-3 shadow-[0_20px_40px_-12px_rgb(0_0_0/0.6)]"
      style={{ borderLeft: `3px solid ${COR[item.tom]}` }}
    >
      <Icone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" style={{ color: COR[item.tom] }} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink">{item.titulo}</p>
        {item.mensagem && <p className="mt-0.5 text-[13px] text-ink-2">{item.mensagem}</p>}
        {item.acao && (
          <button
            type="button"
            onClick={item.acao.aoClicar}
            className="mt-1.5 text-[13px] text-ink underline underline-offset-2"
          >
            {item.acao.rotulo}
          </button>
        )}
      </div>
      <IconButton label="Dispensar aviso" onClick={() => onFechar(item.id)} className="-mr-2 -mt-1">
        <X className="h-4 w-4" aria-hidden="true" />
      </IconButton>
    </div>
  );
};

/**
 * Infraestrutura de avisos não bloqueantes. Avisos comuns entram numa região
 * `aria-live="polite"`. O aviso crítico fica numa região sem `aria-live`: quem
 * anuncia a transição, uma única vez e em `assertive`, é o `AnunciadorSeveridade`.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [itens, setItens] = useState<ToastItem[]>([]);
  const proximo = useRef(1);

  const fechar = useCallback((id: number) => setItens((atuais) => atuais.filter((i) => i.id !== id)), []);
  const mostrar = useCallback((entrada: ToastEntrada) => {
    const id = proximo.current++;
    setItens((atuais) => [...atuais.slice(-3), { ...entrada, id, tom: entrada.tom ?? 'info' }]);
    return id;
  }, []);

  const api = useMemo<ToastApi>(() => ({ mostrar, fechar }), [mostrar, fechar]);
  const criticos = itens.filter((item) => item.tom === 'critico');
  const comuns = itens.filter((item) => item.tom !== 'critico');

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 sm:inset-x-auto sm:right-6 sm:w-96">
        <div aria-live="polite" className="flex flex-col gap-2">
          {comuns.map((item) => (
            <ItemToast key={item.id} item={item} onFechar={fechar} />
          ))}
        </div>
        <div role="region" aria-label="Avisos críticos" className="flex flex-col gap-2">
          {criticos.map((item) => (
            <ItemToast key={item.id} item={item} onFechar={fechar} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};
