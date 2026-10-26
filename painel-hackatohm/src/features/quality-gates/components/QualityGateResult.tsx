import React from 'react';
import { AlertTriangle, CheckCircle2, Gauge, Thermometer } from 'lucide-react';
import { ResultadoGateRealtime } from '@/features/quality-gates/types/qualityGate';
import { SEVERIDADE_THEME } from '@/features/quality-gates/helpers/qualityGateHelper';

interface QualityGateResultProps {
  resultado: ResultadoGateRealtime;
}

function formatarValor(valor: number | null): string | null {
  return valor === null ? null : `${valor} °C`;
}

export const QualityGateResult: React.FC<QualityGateResultProps> = ({ resultado }) => {
  const theme =
    SEVERIDADE_THEME[resultado.severidade] ?? SEVERIDADE_THEME.Normal;
  const metadados = resultado.metadados
    ? Object.entries(resultado.metadados)
    : [];
  const alerta = resultado.disparouAlerta || resultado.severidade !== 'Normal';

  const valorObservado = formatarValor(resultado.valorObservado);
  const valorLimite = formatarValor(resultado.valorLimite);

  return (
    <article className={`overflow-hidden rounded-xl border ${theme.classes}`}>
      <div className="flex items-start gap-3 p-4">
        {alerta ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/70">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/70">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-70">
                Quality Gate
              </p>
              <h5 className="mt-0.5 text-sm font-bold">
                {resultado.nomeRegra || 'Regra de qualidade'}
              </h5>
            </div>
            <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-bold">
              {theme.label}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-md bg-white/60 px-2 py-1 font-semibold">
              <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
              {resultado.tipoRegra}
            </span>
            <span className="rounded-md border border-current/20 px-2 py-1 font-mono">
              {resultado.codigoRegra}
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed">{resultado.mensagemDiagnostico}</p>
          {(valorObservado || valorLimite) ? (
            <dl className="mt-3 grid grid-cols-2 gap-2">
              {valorObservado && (
                <div className="rounded-lg bg-white/55 p-2.5">
                  <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                    <Thermometer className="h-3 w-3" aria-hidden="true" />
                    Observado
                  </dt>
                  <dd className="mt-1 text-sm font-bold">{valorObservado}</dd>
                </div>
              )}
              {valorLimite && (
                <div className="rounded-lg bg-white/55 p-2.5">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                    Limite
                  </dt>
                  <dd className="mt-1 text-sm font-bold">{valorLimite}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="mt-3 rounded-lg bg-white/50 px-3 py-2 text-[11px] font-medium">
              Nenhum limiar foi excedido nesta leitura.
            </p>
          )}
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
