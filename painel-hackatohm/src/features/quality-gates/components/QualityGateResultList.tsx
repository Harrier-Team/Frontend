import React from 'react';
import { ResultadoGateRealtime } from '@/features/quality-gates/types/qualityGate';
import { SEVERIDADE_THEME } from '@/features/quality-gates/helpers/qualityGateHelper';
import { QualityGateResult } from './QualityGateResult';

interface QualityGateResultListProps {
  resultados: ResultadoGateRealtime[];
}

const emAlerta = (r: ResultadoGateRealtime) => r.disparouAlerta || r.severidade !== 'Normal';

/**
 * Silêncio por padrão: só as regras que dispararam aparecem. O restante fica
 * recolhido para quem quer auditar a leitura.
 */
export const QualityGateResultList: React.FC<QualityGateResultListProps> = ({ resultados }) => {
  const lista = Array.isArray(resultados) ? resultados : [];
  if (lista.length === 0) return null;

  const alertas = lista.filter(emAlerta);
  const okCount = lista.length - alertas.length;

  return (
    <div className="mt-4 space-y-3">
      {alertas.map((resultado, index) => (
        <QualityGateResult
          key={`a-${resultado.regraQualidadeId}-${index}`}
          resultado={resultado}
        />
      ))}

      {lista.length > 0 && (
        <details className="group">
          <summary className="inline-flex list-none items-center gap-1.5 text-[13px] text-ink-3 transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
            <span className="inline-block transition-transform group-open:rotate-90" aria-hidden="true">
              ›
            </span>
            {alertas.length === 0
              ? `${okCount} ${okCount === 1 ? 'regra dentro do limite' : 'regras dentro do limite'}`
              : 'Todas as regras desta leitura'}
          </summary>
          <ul className="mt-3 space-y-2 border-l border-line pl-4">
            {lista.map((resultado, index) => {
              const tema = SEVERIDADE_THEME[resultado.severidade] ?? SEVERIDADE_THEME.Normal;
              return (
                <li key={`t-${resultado.regraQualidadeId}-${index}`} className="text-[13px]">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: tema.color }}
                    />
                    <span className="text-ink">{resultado.nomeRegra || 'Regra'}</span>
                    <span className={tema.textClass}>{tema.label}</span>
                  </div>
                  <p className="mt-0.5 pl-3.5 text-ink-3">{resultado.mensagemDiagnostico}</p>
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </div>
  );
};
