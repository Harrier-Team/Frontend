import React from 'react';
import { ResultadoGateRealtime } from '@/features/quality-gates/types/qualityGate';
import { formatarValorGate, obterTipoRegra } from '@/features/quality-gates/helpers/tiposRegra';
import { estadoResultado, EstadoPrincipal } from '../helpers/estadoHelper';
import { SeverityBadge } from './SeverityBadge';

interface GateRowProps {
  resultado: ResultadoGateRealtime;
  /** Escova (número) ou motor (assimetria, repetida pelo backend em cada escova). */
  escopo: { tipo: 'escova'; numeroEscova: number } | { tipo: 'motor' };
  /** Dado desatualizado: cor mantida com 60% de opacidade. */
  esmaecido?: boolean;
}

/** Uma regra avaliada: escopo, regra, severidade e `valor ≥ limite` na unidade do tipo. */
export const GateRow: React.FC<GateRowProps> = ({ resultado, escopo, esmaecido = false }) => {
  const aguardando = estadoResultado(resultado) === 'aguardando-amostras';
  const estado: EstadoPrincipal = aguardando ? 'aguardando-amostras' : resultado.severidade;
  const alerta = !aguardando && resultado.severidade !== 'Normal';
  const tipo = obterTipoRegra(resultado.tipoRegra);
  const temValores = !aguardando && resultado.valorObservado !== null && resultado.valorLimite !== null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 py-3">
      <p className="min-w-0 text-[15px] text-ink">
        <span className="text-ink-2">{escopo.tipo === 'motor' ? 'Motor' : `Escova ${escopo.numeroEscova}`}</span>
        <span aria-hidden="true" className="px-1.5 text-ink-3">
          ·
        </span>
        {resultado.nomeRegra || tipo.rotulo}
      </p>
      <SeverityBadge estado={estado} esmaecido={esmaecido && alerta} />
      {(temValores || resultado.mensagemDiagnostico) && (
        <div className="col-span-2 flex flex-wrap items-baseline justify-between gap-x-4 text-[13px]">
          {resultado.mensagemDiagnostico && (
            <p className="min-w-0 flex-1 text-ink-2">{resultado.mensagemDiagnostico}</p>
          )}
          {temValores && (
            <p className="num ml-auto whitespace-nowrap text-ink-2">
              <span className="text-ink">{formatarValorGate(resultado.tipoRegra, resultado.valorObservado)}</span>
              {' ≥ '}
              {formatarValorGate(resultado.tipoRegra, resultado.valorLimite)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
