import React from 'react';
import { ResultadoGateRealtime } from '@/features/quality-gates/types/qualityGate';
import { SEVERIDADE_THEME } from '@/features/quality-gates/helpers/qualityGateHelper';
import { formatarGrau } from '@/features/telemetria/helpers/statusHelper';

/** Uma regra que disparou: o que aconteceu, quanto e contra qual limite. */
export const QualityGateResult: React.FC<{ resultado: ResultadoGateRealtime }> = ({ resultado }) => {
  const tema = SEVERIDADE_THEME[resultado.severidade] ?? SEVERIDADE_THEME.Normal;
  const temValores = resultado.valorObservado !== null || resultado.valorLimite !== null;

  return (
    <div
      className="py-0.5 pl-4"
      style={{ borderLeft: `2px solid ${tema.color}` }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm text-ink">
          {resultado.nomeRegra || 'Regra de qualidade'}
          <span className={`ml-2 text-[13px] ${tema.textClass}`}>{tema.label}</span>
        </p>
        {temValores && (
          <p className="num text-[13px] text-ink-2">
            {resultado.valorObservado !== null && (
              <span className="text-ink">{formatarGrau(resultado.valorObservado)} °C</span>
            )}
            {resultado.valorObservado !== null && resultado.valorLimite !== null && ' de '}
            {resultado.valorLimite !== null && <span>{formatarGrau(resultado.valorLimite)} °C</span>}
          </p>
        )}
      </div>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{resultado.mensagemDiagnostico}</p>
    </div>
  );
};
