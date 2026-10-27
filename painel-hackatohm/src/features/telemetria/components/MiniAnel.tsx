import React from 'react';
import { EstadoPrincipal, ehSeveridadeAnormal } from '../helpers/estadoHelper';
import { TEMA_ESTADO } from '../helpers/apresentacao';
import { posicoesDasEscovas } from '../helpers/anel';

interface MiniAnelProps {
  /** Estado de cada escova (a ordem do número da escova define a posição). */
  escovas: Array<{ numeroEscova: number; estado: EstadoPrincipal }>;
  /** Dado atrasado ou offline: pontos a 60%. */
  esmaecido?: boolean;
  size?: number;
  /** Descrição para leitores de tela; sem ela o desenho é decorativo. */
  descricao?: string;
}

/**
 * Anel em miniatura (28 px) para a linha do motor: um ponto por escova.
 * Cinza em Normal, cor só em Atenção, Alerta e Crítico, vazado quando não há
 * severidade (sem leitura, aguardando amostras, sem regras). Esquemático.
 */
export const MiniAnel: React.FC<MiniAnelProps> = ({ escovas, esmaecido = false, size = 28, descricao }) => {
  const centro = size / 2;
  const raio = size / 2 - 5;
  const pontos = posicoesDasEscovas(
    escovas.map((e) => e.numeroEscova),
    centro,
    centro,
    raio
  );
  const estados = new Map(escovas.map((e) => [e.numeroEscova, e.estado]));
  const r = pontos.length > 8 ? 1.8 : pontos.length > 5 ? 2.2 : 3;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role={descricao ? 'img' : undefined}
      aria-label={descricao}
      aria-hidden={descricao ? undefined : true}
      className="shrink-0"
    >
      <circle cx={centro} cy={centro} r={raio} fill="none" stroke="var(--color-line-strong)" strokeWidth={1.5} />
      {pontos.map((p) => {
        const estado = estados.get(p.numeroEscova) ?? 'sem-leitura';
        const anormal = ehSeveridadeAnormal(estado);
        const comSeveridade = anormal || estado === 'Normal';
        const cor = anormal ? TEMA_ESTADO[estado].color : 'var(--color-ink-2)';
        return (
          <circle
            key={p.numeroEscova}
            cx={p.x}
            cy={p.y}
            r={r}
            fill={comSeveridade ? cor : 'var(--color-panel)'}
            stroke={comSeveridade ? 'var(--color-panel)' : 'var(--color-ink-3)'}
            strokeWidth={comSeveridade ? 1 : 1.25}
            opacity={esmaecido ? 0.6 : 1}
          />
        );
      })}
    </svg>
  );
};
