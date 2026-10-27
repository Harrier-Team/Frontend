import React from 'react';
import { ParametrosRegra } from '@/features/quality-gates/types/regraQualidade';
import { escalaDoGauge, textoDoMedidor } from '../helpers/apresentacao';

interface ThermalGaugeProps {
  valor: number | null | undefined;
  label: string;
  /** Limites da regra de limiar estático do motor. Sem regra, o medidor não aparece. */
  limites: ParametrosRegra | null | undefined;
  /** Cor do ponto (token). Padrão: ponto de luz `flare`. Passe a cor só em severidade anormal. */
  cor?: string;
}

/**
 * Linha fina com faixas de aviso e crítico da regra do motor e o ponto de luz
 * no valor atual. Sem regra de limiar estático, não há escala para mostrar e o
 * componente não desenha nada (nada de limites inventados).
 */
export const ThermalGauge: React.FC<ThermalGaugeProps> = ({ valor, label, limites, cor }) => {
  if (!limites) return null;

  const temValor = typeof valor === 'number' && !Number.isNaN(valor);
  const { min, max } = escalaDoGauge(limites, valor);
  const pct = (v: number) => `${((Math.min(Math.max(v, min), max) - min) / (max - min)) * 100}%`;
  const corPonto = cor ?? 'var(--color-flare)';

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={temValor ? valor : undefined}
      aria-valuetext={temValor ? textoDoMedidor(valor, limites) : 'Sem leitura'}
      className="relative h-4 w-full"
    >
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line-strong" />
      <div
        className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full"
        style={{
          left: pct(limites.aviso),
          width: `calc(${pct(limites.critico)} - ${pct(limites.aviso)})`,
          background: 'color-mix(in srgb, var(--color-sev-alerta) 40%, transparent)',
        }}
      />
      <div
        className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full"
        style={{
          left: pct(limites.critico),
          right: 0,
          background: 'color-mix(in srgb, var(--color-sev-critico) 45%, transparent)',
        }}
      />
      {temValor && (
        <span
          aria-hidden="true"
          className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[left] duration-300 ease-[var(--ease-out)]"
          style={{
            left: pct(valor),
            background: corPonto,
            boxShadow: `0 0 0 3px color-mix(in srgb, ${corPonto} 18%, transparent), 0 0 12px color-mix(in srgb, ${corPonto} 60%, transparent)`,
          }}
        />
      )}
    </div>
  );
};
