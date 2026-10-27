import React from 'react';
import { EstadoPrincipal } from '../helpers/estadoHelper';
import { SIMBOLO_ESTADO } from '../helpers/simbolos';
import { TEMA_ESTADO } from '../helpers/apresentacao';

interface SeveritySymbolProps {
  estado: EstadoPrincipal;
  size?: number;
  /** Dado desatualizado: a cor é mantida, mas com 60% de opacidade. */
  esmaecido?: boolean;
  /** Use quando o texto do estado já está ao lado (evita leitura duplicada). */
  decorativo?: boolean;
}

/** Símbolo + cor de uma severidade ou estado de avaliação; sempre com `aria-label`. */
export const SeveritySymbol: React.FC<SeveritySymbolProps> = ({
  estado,
  size = 16,
  esmaecido = false,
  decorativo = false,
}) => {
  const Icone = SIMBOLO_ESTADO[estado];
  const tema = TEMA_ESTADO[estado];
  return (
    <Icone
      width={size}
      height={size}
      strokeWidth={estado === 'Normal' ? 2.5 : 2}
      fill={estado === 'Normal' ? 'currentColor' : 'none'}
      absoluteStrokeWidth={false}
      className="shrink-0"
      style={{ color: tema.color, opacity: esmaecido ? 0.6 : 1, ...(estado === 'Normal' ? { transform: 'scale(0.55)' } : {}) }}
      role={decorativo ? undefined : 'img'}
      aria-label={decorativo ? undefined : tema.label}
      aria-hidden={decorativo ? true : undefined}
    />
  );
};
