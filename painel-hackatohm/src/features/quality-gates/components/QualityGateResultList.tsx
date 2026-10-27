import React from 'react';
import { ResultadoGateRealtime } from '@/features/quality-gates/types/qualityGate';
import { SEVERIDADE_THEME } from '@/features/quality-gates/helpers/qualityGateHelper';
import { estadoResultado } from '@/features/telemetria/helpers/estadoHelper';
import { QualityGateResult } from './QualityGateResult';

interface QualityGateResultListProps {
  resultados: ResultadoGateRealtime[];
}

const aguardando = (r: ResultadoGateRealtime) => estadoResultado(r) === 'aguardando-amostras';
const emAlerta = (r: ResultadoGateRealtime) =>
  !aguardando(r) && (r.disparouAlerta || r.severidade !== 'Normal');

function plural(n: number, singular: string, pluralForm: string) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

/**
 * Silêncio por padrão: só as regras que dispararam aparecem. O restante fica
 * recolhido para quem quer auditar a leitura. Resultado sem amostras
 * suficientes nunca é contado como dentro do limite, e lista vazia é
 * "Sem regras".
 */
export const QualityGateResultList: React.FC<QualityGateResultListProps> = ({ resultados }) => {
  const lista = Array.isArray(resultados) ? resultados : [];

  if (lista.length === 0) {
    return (
      <p className="mt-4 text-[13px] text-ink-3">
        Sem regras. Vincule uma regra a este motor para avaliar as leituras.
      </p>
    );
  }

  const alertas = lista.filter(emAlerta);
  const esperando = lista.filter(aguardando).length;
  const dentroDoLimite = lista.length - alertas.length - esperando;

  const partes: string[] = [];
  if (dentroDoLimite > 0) {
    partes.push(plural(dentroDoLimite, 'regra dentro do limite', 'regras dentro do limite'));
  }
  if (esperando > 0) partes.push(`${esperando} aguardando amostras`);
  const resumo = alertas.length === 0 ? partes.join(' · ') : 'Todas as regras desta leitura';

  return (
    <div className="mt-4 space-y-3">
      {alertas.map((resultado, index) => (
        <QualityGateResult
          key={`a-${resultado.regraQualidadeId}-${index}`}
          resultado={resultado}
        />
      ))}

      <details className="group">
        <summary className="inline-flex list-none items-center gap-1.5 text-[13px] text-ink-3 transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
          <span className="inline-block transition-transform group-open:rotate-90" aria-hidden="true">
            ›
          </span>
          {resumo}
        </summary>
        <ul className="mt-3 space-y-2 border-l border-line pl-4">
          {lista.map((resultado, index) => {
            const espera = aguardando(resultado);
            const tema = SEVERIDADE_THEME[resultado.severidade] ?? SEVERIDADE_THEME.Normal;
            return (
              <li key={`t-${resultado.regraQualidadeId}-${index}`} className="text-[13px]">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full"
                    style={
                      espera
                        ? { border: '1.5px solid var(--color-data-off)' }
                        : { background: tema.color }
                    }
                  />
                  <span className="text-ink">{resultado.nomeRegra || 'Regra'}</span>
                  <span className={espera ? 'text-ink-3' : tema.textClass}>
                    {espera ? 'Aguardando amostras' : tema.label}
                  </span>
                </div>
                {resultado.mensagemDiagnostico && (
                  <p className="mt-0.5 pl-3.5 text-ink-3">{resultado.mensagemDiagnostico}</p>
                )}
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
};
