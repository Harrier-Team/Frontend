import React from 'react';
import type { ResultadoGateRecebido } from '../types/qualityGate';
import { obterSeveridadeGate, SEVERIDADE_THEME } from '../helpers/qualityGateHelper';

export const QualityGateStatusBadge: React.FC<{ resultado: ResultadoGateRecebido }> = ({ resultado }) => {
  const severidade = obterSeveridadeGate(resultado);
  const tema = SEVERIDADE_THEME[severidade];
  return (
    <span
      data-severidade={severidade}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tema.textClass}`}
      style={{
        color: tema.color,
        borderColor: `color-mix(in srgb, ${tema.color} 35%, transparent)`,
        background: `color-mix(in srgb, ${tema.color} 10%, transparent)`,
      }}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: tema.color }} />
      {tema.label}
    </span>
  );
};
