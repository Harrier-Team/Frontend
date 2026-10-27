import React from 'react';
import { escalaDaRegra, posicaoNaEscala } from '@/features/telemetria/helpers/valorRegra';
import { formatarValorGate } from '../helpers/tiposRegra';

interface EscalaLimitesProps {
  tipoRegra: string;
  aviso: number;
  critico: number;
  /** Valor atual medido (marcador de luz). Sem valor, só a escala. */
  valor?: number | null;
  className?: string;
}

/**
 * Prévia da escala de uma regra: normal, aviso e crítico, com os limites na
 * unidade do tipo e o valor atual como ponto de luz. As faixas vêm dos limites
 * informados; o marcador é só posição, nunca classificação.
 */
export const EscalaLimites: React.FC<EscalaLimitesProps> = ({
  tipoRegra,
  aviso,
  critico,
  valor,
  className = '',
}) => {
  if (!Number.isFinite(aviso) || !Number.isFinite(critico) || aviso >= critico) {
    return (
      <p className={`text-[13px] text-ink-3 ${className}`}>
        Informe aviso menor que crítico para ver a escala.
      </p>
    );
  }

  const escala = escalaDaRegra(tipoRegra, { aviso, critico }, valor);
  const pAviso = posicaoNaEscala(aviso, escala);
  const pCritico = posicaoNaEscala(critico, escala);
  const temValor = typeof valor === 'number' && Number.isFinite(valor);
  const descricao = `Escala: normal abaixo de ${formatarValorGate(tipoRegra, aviso, 'limite')}, aviso a partir de ${formatarValorGate(
    tipoRegra,
    aviso,
    'limite'
  )}, crítico a partir de ${formatarValorGate(tipoRegra, critico, 'limite')}.${
    temValor ? ` Valor atual ${formatarValorGate(tipoRegra, valor)}.` : ''
  }`;

  return (
    <div className={className}>
      <div role="img" aria-label={descricao} className="relative h-4">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full">
          <div className="absolute inset-y-0 left-0 bg-line-strong" style={{ width: `${pAviso}%` }} />
          <div
            className="absolute inset-y-0"
            style={{
              left: `${pAviso}%`,
              width: `${pCritico - pAviso}%`,
              background: 'color-mix(in srgb, var(--color-sev-alerta) 65%, transparent)',
            }}
          />
          <div
            className="absolute inset-y-0 right-0"
            style={{
              left: `${pCritico}%`,
              background: 'color-mix(in srgb, var(--color-sev-critico) 70%, transparent)',
            }}
          />
        </div>
        {temValor && (
          <span
            aria-hidden="true"
            className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[left] duration-300 ease-[var(--ease-out)]"
            style={{
              left: `${posicaoNaEscala(valor, escala)}%`,
              background: 'var(--color-flare)',
              boxShadow:
                '0 0 0 3px color-mix(in srgb, var(--color-flare) 20%, transparent), 0 0 10px color-mix(in srgb, var(--color-flare) 60%, transparent)',
            }}
          />
        )}
      </div>
      <div className="num relative mt-1 h-4 text-xs text-ink-3" aria-hidden="true">
        <span className="absolute left-0">Normal</span>
        <span className="absolute -translate-x-full pr-1" style={{ left: `${pAviso}%`, color: 'var(--color-sev-alerta)' }}>
          aviso {formatarValorGate(tipoRegra, aviso, 'limite')}
        </span>
        <span className="absolute pl-1" style={{ left: `${pCritico}%`, color: 'var(--color-sev-critico)' }}>
          crítico {formatarValorGate(tipoRegra, critico, 'limite')}
        </span>
      </div>
    </div>
  );
};
