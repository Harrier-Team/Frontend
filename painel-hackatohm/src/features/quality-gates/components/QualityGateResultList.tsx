import React from 'react';
import { ResultadoGateRealtime } from '@/features/quality-gates/types/qualityGate';
import { normalizarResultadosQualityGates, SEVERIDADE_THEME } from '@/features/quality-gates/helpers/qualityGateHelper';
import { QualityGateResult } from './QualityGateResult';

interface QualityGateResultListProps {
  resultados: ResultadoGateRealtime[];
}

const emAlerta = (r: ResultadoGateRealtime) =>
  r.severidade === 'Critico' || r.severidade === 'AlertaPreditivo' || r.severidade === 'Atencao';

/**
 * Silêncio por padrão: só as regras que dispararam aparecem. O restante fica
 * recolhido para quem quer auditar a leitura.
 */
export const QualityGateResultList: React.FC<QualityGateResultListProps> = ({ resultados }) => {
  const lista = normalizarResultadosQualityGates(resultados).sort((a, b) =>
    SEVERIDADE_THEME[b.severidade].prioridade - SEVERIDADE_THEME[a.severidade].prioridade
  );
  if (lista.length === 0) return null;

  const alertas = lista.filter(emAlerta);
  const pendentes = lista.filter((r) => !emAlerta(r) && r.severidade !== 'Normal');
  const okCount = lista.filter((r) => r.severidade === 'Normal').length;

  return (
    <div className="mt-4 space-y-3">
      {alertas.length > 0 && (
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-2">
          Gates em alerta <span className="num ml-1">{alertas.length}</span>
        </p>
      )}
      {alertas.map((resultado, index) => (
        <QualityGateResult
          key={`a-${resultado.regraQualidadeId}-${index}`}
          resultado={resultado}
        />
      ))}
      {pendentes.length > 0 && <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-3">Avaliação indisponível</p>
        {pendentes.map((resultado, index) => <QualityGateResult
          key={`p-${resultado.regraQualidadeId}-${index}`} resultado={resultado} />)}
      </div>}

      {lista.length > 0 && (
        <details className="group">
          <summary className="inline-flex list-none items-center gap-1.5 text-[13px] text-ink-3 transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
            <span className="inline-block transition-transform group-open:rotate-90" aria-hidden="true">
              ›
            </span>
            {alertas.length === 0 && pendentes.length === 0
              ? `${okCount} ${okCount === 1 ? 'regra dentro do limite' : 'regras dentro do limite'}`
              : `Todas as regras desta leitura (${lista.length})`}
          </summary>
          <ul className="mt-3 space-y-2 border-l border-line pl-4">
            {lista.map((resultado, index) => <li key={`t-${resultado.regraQualidadeId}-${index}`}>
              <QualityGateResult resultado={resultado} />
            </li>)}
          </ul>
        </details>
      )}
    </div>
  );
};
