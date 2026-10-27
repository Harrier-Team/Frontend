import React from 'react';
import { NivelSeveridade } from '@/features/quality-gates/types/qualityGate';
import { ParametrosRegra } from '@/features/quality-gates/types/regraQualidade';
import { SEVERIDADE_THEME } from '@/features/quality-gates/helpers/qualityGateHelper';
import { ehSeveridadeAnormal } from '../helpers/estadoHelper';
import { escalaDoGauge } from '../helpers/apresentacao';

interface ThermalGaugeProps {
  valor: number | null | undefined;
  /** Severidade do backend; null quando não há avaliação concluída. */
  severidade: NivelSeveridade | null;
  label: string;
  /**
   * Limites da regra de limiar estático vinculada ao motor. Sem regra, o
   * medidor mostra só a posição da leitura, sem faixas de aviso e crítico.
   */
  limites?: ParametrosRegra | null;
}

/**
 * Linha fina com o ponto de luz da leitura atual. As faixas de aviso e crítico
 * aparecem em tom discreto, e só quando vêm de uma regra do motor.
 */
export const ThermalGauge: React.FC<ThermalGaugeProps> = ({ valor, severidade, label, limites }) => {
  const anormal = ehSeveridadeAnormal(severidade);
  const cor = anormal ? SEVERIDADE_THEME[severidade as NivelSeveridade].color : 'var(--color-flare)';
  const temValor = typeof valor === 'number' && !Number.isNaN(valor);
  const { min, max } = escalaDoGauge(limites, valor);
  const pct = (v: number) => `${((Math.min(Math.max(v, min), max) - min) / (max - min)) * 100}%`;

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={temValor ? valor : undefined}
      className="relative h-4 w-full"
    >
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line-strong" />
      {limites && (
        <>
          <div
            className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full"
            style={{
              left: pct(limites.aviso),
              width: `calc(${pct(limites.critico)} - ${pct(limites.aviso)})`,
              background: 'color-mix(in srgb, var(--color-sev-atencao) 28%, transparent)',
            }}
          />
          <div
            className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full"
            style={{
              left: pct(limites.critico),
              right: 0,
              background: 'color-mix(in srgb, var(--color-sev-critico) 32%, transparent)',
            }}
          />
        </>
      )}
      {temValor && (
        <span
          aria-hidden="true"
          className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[left] duration-700 ease-[var(--ease-out)]"
          style={{
            left: pct(valor),
            background: cor,
            boxShadow: `0 0 0 3px color-mix(in srgb, ${cor} 18%, transparent), 0 0 12px ${
              anormal ? cor : 'rgb(241 237 228 / 0.5)'
            }`,
          }}
        />
      )}
    </div>
  );
};
