import React from 'react';
import { EstadoPrincipal } from '../helpers/estadoHelper';
import { TEMA_ESTADO } from '../helpers/apresentacao';
import { SeveritySymbol } from './SeveritySymbol';

interface SeverityBadgeProps {
  estado: EstadoPrincipal;
  /** Versão menor, para linhas densas. */
  compacto?: boolean;
  /** Fundo tingido: só faz efeito em Crítico. */
  tingido?: boolean;
  esmaecido?: boolean;
  className?: string;
}

const COR_TEXTO: Partial<Record<EstadoPrincipal, string>> = {
  Atencao: 'var(--color-sev-atencao)',
  AlertaPreditivo: 'var(--color-sev-alerta)',
  Critico: 'var(--color-sev-critico)',
};

/** Símbolo + texto do estado. Normal e estados neutros mantêm o texto em tom de aço. */
export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  estado,
  compacto = false,
  tingido = false,
  esmaecido = false,
  className = '',
}) => {
  const tema = TEMA_ESTADO[estado];
  const comFundo = tingido && estado === 'Critico';
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap ${
        compacto ? 'text-xs' : 'text-[13px]'
      } ${comFundo ? 'rounded-[var(--radius-control)] px-2 py-0.5' : ''} ${className}`}
      style={{
        color: COR_TEXTO[estado] ?? 'var(--color-ink-2)',
        opacity: esmaecido ? 0.6 : 1,
        background: comFundo
          ? 'color-mix(in srgb, var(--color-sev-critico) 14%, var(--color-panel))'
          : undefined,
      }}
    >
      <SeveritySymbol estado={estado} size={compacto ? 14 : 16} decorativo />
      {tema.label}
    </span>
  );
};
