import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ResultadoGateRealtime } from '../../types/qualityGate';
import { SEVERIDADE_THEME } from '../../utils/qualityGateHelper';

interface QualityGateResultProps {
  resultado: ResultadoGateRealtime;
}

function formatarValor(valor: number | null): string {
  return valor === null ? 'Não informado' : `${valor} °C`;
}

export const QualityGateResult: React.FC<QualityGateResultProps> = ({ resultado }) => {
  const theme = SEVERIDADE_THEME[resultado.severidade];
  const metadados = resultado.metadados
    ? Object.entries(resultado.metadados)
    : [];
  const alerta = resultado.disparouAlerta || resultado.severidade !== 'Normal';

  return (
    <article className={`rounded-lg border p-3 ${theme.classes}`}>
      <div className="flex items-start gap-2">
        {alerta ? (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-xs">{theme.label}</strong>
            <span className="text-[11px] font-semibold opacity-80">
              {resultado.nomeRegra}
            </span>
            <span className="rounded border border-current/20 px-1.5 py-0.5 text-[10px] font-mono">
              {resultado.codigoRegra}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed">{resultado.mensagemDiagnostico}</p>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <dt className="opacity-70">Observado</dt>
              <dd className="font-semibold">{formatarValor(resultado.valorObservado)}</dd>
            </div>
            <div>
              <dt className="opacity-70">Limite</dt>
              <dd className="font-semibold">{formatarValor(resultado.valorLimite)}</dd>
            </div>
          </dl>
          {metadados.length > 0 && (
            <div className="mt-2 border-t border-current/15 pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                Metadados
              </p>
              <dl className="mt-1 space-y-0.5 text-[11px]">
                {metadados.map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <dt className="font-semibold">{key}:</dt>
                    <dd className="break-all">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
