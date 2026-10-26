import React from 'react';
import { Radio } from 'lucide-react';
import { ResultadoGateRealtime } from '@/features/quality-gates/types/qualityGate';
import { QualityGateResult } from './QualityGateResult';

interface QualityGateResultListProps {
  resultados: ResultadoGateRealtime[];
}

export const QualityGateResultList: React.FC<QualityGateResultListProps> = ({
  resultados,
}) => {
  const resultadosSeguros = Array.isArray(resultados) ? resultados : [];

  return (
  <div className="mt-3 border-t border-slate-200 pt-3">
    <div className="mb-2 flex items-center gap-1.5">
      <Radio className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" />
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
        Quality Gates nesta leitura
      </h4>
    </div>
    {resultadosSeguros.length === 0 ? (
      <p className="text-xs text-slate-500">Nenhum resultado de gate nesta leitura.</p>
    ) : (
      <div className="space-y-2">
        {resultadosSeguros.map((resultado, index) => (
          <QualityGateResult
            key={`${resultado.regraQualidadeId}-${resultado.codigoRegra}-${index}`}
            resultado={resultado}
          />
        ))}
      </div>
    )}
  </div>
  );
};
