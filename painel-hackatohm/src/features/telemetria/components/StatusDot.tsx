import React from 'react';
import { NivelStatus } from '../types/telemetria';
import { STATUS_THEME } from '../helpers/statusHelper';

/** Ponto de estado. Offline é vazado; perigo pulsa de leve. Nunca depende só da cor: sempre acompanhado de texto ou aria-label. */
export const StatusDot: React.FC<{ status: NivelStatus; size?: number }> = ({ status, size = 8 }) => {
  const cor = STATUS_THEME[status].color;
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: status === 'offline' ? 'transparent' : cor,
        border: status === 'offline' ? `1.5px solid ${cor}` : undefined,
        boxShadow: status === 'perigo' ? `0 0 10px ${cor}` : undefined,
        animation: status === 'perigo' ? 'flare-breathe 2.4s ease-in-out infinite' : undefined,
      }}
    />
  );
};
