import React from 'react';
import { EstadoPrincipal } from '../helpers/estadoHelper';
import { TEMA_ESTADO } from '../helpers/apresentacao';

const SEVERIDADES = new Set<EstadoPrincipal>(['Normal', 'Atencao', 'AlertaPreditivo', 'Critico']);

/**
 * Ponto de estado. Severidades são pontos cheios (crítico pulsa de leve);
 * estados de avaliação e de dado (offline, aguardando…) são vazados.
 * Nunca depende só da cor: sempre acompanhado de texto ou aria-label.
 */
export const StatusDot: React.FC<{ estado: EstadoPrincipal; size?: number }> = ({
  estado,
  size = 8,
}) => {
  const cor = TEMA_ESTADO[estado].color;
  const cheio = SEVERIDADES.has(estado);
  const critico = estado === 'Critico';
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: cheio ? cor : 'transparent',
        border: cheio ? undefined : `1.5px solid ${cor}`,
        boxShadow: critico ? `0 0 10px ${cor}` : undefined,
        animation: critico ? 'flare-breathe 2.4s ease-in-out infinite' : undefined,
      }}
    />
  );
};
