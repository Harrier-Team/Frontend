import React from 'react';
import { ResultadoGateRealtime } from '@/features/quality-gates/types/qualityGate';
import { obterSeveridadeGate, SEVERIDADE_THEME } from '@/features/quality-gates/helpers/qualityGateHelper';
import { QualityGateStatusBadge } from './QualityGateStatusBadge';
import { formatarValorRegra, obterMetadadosRegra, obterTipoRegra } from '../helpers/tipoRegraHelper';

/** Uma regra que disparou: o que aconteceu, quanto e contra qual limite. */
export const QualityGateResult: React.FC<{ resultado: ResultadoGateRealtime }> = ({ resultado }) => {
  const severidade = obterSeveridadeGate(resultado);
  const tema = SEVERIDADE_THEME[severidade];
  const temValores = resultado.valorObservado !== null || resultado.valorLimite !== null;
  const tipo = obterTipoRegra(resultado.tipoRegra);
  const metadados = obterMetadadosRegra(resultado);

  return (
    <div
      data-severidade={severidade}
      className="rounded-lg px-4 py-3"
      style={{
        borderLeft: `3px solid ${tema.color}`,
        background: `color-mix(in srgb, ${tema.color} 6%, transparent)`,
      }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink">
          {resultado.nomeRegra || 'Regra de qualidade'}
          <QualityGateStatusBadge resultado={resultado} />
        </div>
        {temValores && (
          <p className="num text-[13px] text-ink-2">
            <span className="text-ink">{formatarValorRegra(resultado.valorObservado, resultado.tipoRegra)}</span>
            {' de '}
            <span>{formatarValorRegra(resultado.valorLimite, resultado.tipoRegra)}</span>
          </p>
        )}
      </div>
      <p className="mt-1 text-[11px] text-ink-3">{tipo?.nome ?? resultado.tipoRegra}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{resultado.mensagemDiagnostico}</p>
      {!tipo && <p className="mt-1 text-xs text-ink-3">Unidade não informada para este tipo de regra.</p>}
      {metadados.length > 0 && <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-ink-2">
        {metadados.map((campo) => <div key={campo.label}>
          <dt className="text-ink-3">{campo.label}</dt>
          <dd className="num mt-0.5">{campo.valor}</dd>
        </div>)}
      </dl>}
    </div>
  );
};
