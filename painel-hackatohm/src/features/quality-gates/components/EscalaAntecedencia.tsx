import React from 'react';
import { formatarDuracaoMinutos } from '@/utils/tempo';
import { fraseDaAntecedencia, posicoesNaRegua } from '../helpers/antecedencia';

interface EscalaAntecedenciaProps {
  aviso: number;
  critico: number;
  temperaturaLimite?: number;
  className?: string;
}

/**
 * Prévia da regra de previsão: uma régua de tempo da direita para a esquerda
 * (agora ← crítico ← aviso ← sem urgência). As faixas vêm só dos minutos
 * informados; nada é classificado aqui.
 */
export const EscalaAntecedencia: React.FC<EscalaAntecedenciaProps> = ({
  aviso,
  critico,
  temperaturaLimite,
  className = '',
}) => {
  const posicoes = posicoesNaRegua(aviso, critico);
  const frase = fraseDaAntecedencia(aviso, critico, temperaturaLimite);
  if (!posicoes || !frase) {
    return (
      <p className={`text-[13px] text-ink-3 ${className}`}>
        Informe o aviso com mais minutos que o crítico para ver a escala.
      </p>
    );
  }

  return (
    <div className={className}>
      <div role="img" aria-label={`Escala de antecedência. ${frase}.`} className="relative h-4">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full">
          <div className="absolute inset-y-0 left-0 bg-line-strong" style={{ width: `${posicoes.aviso}%` }} />
          <div
            className="absolute inset-y-0"
            style={{
              left: `${posicoes.aviso}%`,
              width: `${posicoes.critico - posicoes.aviso}%`,
              background: 'color-mix(in srgb, var(--color-sev-alerta) 65%, transparent)',
            }}
          />
          <div
            className="absolute inset-y-0 right-0"
            style={{
              left: `${posicoes.critico}%`,
              background: 'color-mix(in srgb, var(--color-sev-critico) 70%, transparent)',
            }}
          />
        </div>
      </div>
      <div className="num relative mt-1 h-4 text-xs text-ink-3" aria-hidden="true">
        <span className="absolute left-0">sem urgência</span>
        <span className="absolute -translate-x-full pr-1" style={{ left: `${posicoes.aviso}%`, color: 'var(--color-sev-alerta)' }}>
          aviso {formatarDuracaoMinutos(aviso)}
        </span>
        <span className="absolute pl-1" style={{ left: `${posicoes.critico}%`, color: 'var(--color-sev-critico)' }}>
          crítico {formatarDuracaoMinutos(critico)}
        </span>
        <span className="absolute right-0">agora</span>
      </div>
      <p className="mt-2 text-[13px] text-ink-2">{frase}.</p>
    </div>
  );
};
