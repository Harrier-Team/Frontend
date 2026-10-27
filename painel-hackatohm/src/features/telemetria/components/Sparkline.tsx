import React from 'react';
import { caminhoLinha, pontosSparkline } from '../helpers/grafico';

interface SparklineProps {
  valores: number[];
  width?: number;
  height?: number;
  /** Descrição para leitores de tela (a linha em si é decorativa). */
  descricao?: string;
  esmaecido?: boolean;
}

/** Tendência em miniatura: sem eixos, ponto de luz no último valor. */
export const Sparkline: React.FC<SparklineProps> = ({
  valores,
  width = 80,
  height = 24,
  descricao,
  esmaecido = false,
}) => {
  const pontos = pontosSparkline(valores, width, height, 3);
  const ultimo = pontos[pontos.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role={descricao ? 'img' : undefined}
      aria-label={descricao}
      aria-hidden={descricao ? undefined : true}
      style={{ opacity: esmaecido ? 0.6 : 1 }}
      className="shrink-0 overflow-visible"
    >
      {pontos.length === 0 ? (
        <line
          x1={3}
          x2={width - 3}
          y1={height / 2}
          y2={height / 2}
          stroke="var(--color-line-strong)"
          strokeDasharray="2 3"
        />
      ) : (
        <>
          <path
            d={caminhoLinha(pontos)}
            fill="none"
            stroke="var(--color-ink-3)"
            strokeWidth={1.25}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <circle
            cx={ultimo.x}
            cy={ultimo.y}
            r={2.5}
            fill="var(--color-flare)"
            style={{ filter: 'drop-shadow(0 0 3px color-mix(in srgb, var(--color-flare) 70%, transparent))' }}
          />
        </>
      )}
    </svg>
  );
};
