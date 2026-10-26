import React from 'react';
import { NivelStatus } from '../types/telemetria';
import {
  ESCALA_MAXIMA,
  LIMITE_ATENCAO,
  LIMITE_PERIGO,
  STATUS_THEME,
} from '../helpers/statusHelper';

interface ThermalGaugeProps {
  valor: number | null | undefined;
  status: NivelStatus;
  label: string;
}

const pct = (valor: number) => `${(Math.min(Math.max(valor, 0), ESCALA_MAXIMA) / ESCALA_MAXIMA) * 100}%`;

/**
 * Linha fina de 0 a 200 °C. As faixas de atenção e perigo aparecem em tom
 * discreto e o ponto de luz mostra a leitura atual, ou seja, a distância até o limite.
 */
export const ThermalGauge: React.FC<ThermalGaugeProps> = ({ valor, status, label }) => {
  const cor = STATUS_THEME[status].color;
  const temValor = typeof valor === 'number' && !Number.isNaN(valor);

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={ESCALA_MAXIMA}
      aria-valuenow={temValor ? valor : undefined}
      className="relative h-4 w-full"
    >
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line-strong" />
      <div
        className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full"
        style={{
          left: pct(LIMITE_ATENCAO),
          width: `calc(${pct(LIMITE_PERIGO)} - ${pct(LIMITE_ATENCAO)})`,
          background: 'color-mix(in srgb, var(--color-warn) 28%, transparent)',
        }}
      />
      <div
        className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full"
        style={{
          left: pct(LIMITE_PERIGO),
          right: 0,
          background: 'color-mix(in srgb, var(--color-hot) 32%, transparent)',
        }}
      />
      {temValor && (
        <span
          aria-hidden="true"
          className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[left] duration-700 ease-[var(--ease-out)]"
          style={{
            left: pct(valor),
            background: status === 'normal' ? 'var(--color-flare)' : cor,
            boxShadow: `0 0 0 3px color-mix(in srgb, ${
              status === 'normal' ? 'var(--color-flare)' : cor
            } 18%, transparent), 0 0 12px ${status === 'normal' ? 'rgb(241 237 228 / 0.5)' : cor}`,
          }}
        />
      )}
    </div>
  );
};
