import React from 'react';
import { ResultadoGateRealtime } from '@/features/quality-gates/types/qualityGate';
import {
  ehPrevisao,
  formatarValorELimite,
  formatarValorGate,
  nomeRegraDistinto,
  obterTipoRegra,
} from '@/features/quality-gates/helpers/tiposRegra';
import { formatarHorarioPrevisto, formatarMinutos } from '@/utils/tempo';
import { metadadosDoGate } from '../helpers/diagnosticos';
import { formatarLimitePrevisto, lerPrevisao } from '../helpers/previsao';
import { ehSeveridadeAnormal, estadoResultado, EstadoPrincipal } from '../helpers/estadoHelper';
import { SeverityBadge } from './SeverityBadge';

interface GateRowProps {
  resultado: ResultadoGateRealtime;
  /** Escova (número) ou motor (assimetria, repetida pelo backend em cada escova). */
  escopo: { tipo: 'escova'; numeroEscova: number } | { tipo: 'motor' };
  /** Dado desatualizado: cor mantida com 60% de opacidade. */
  esmaecido?: boolean;
  /** `dataHora` do lote: âncora do horário previsto na regra de tendência. */
  dataHora?: string;
  /** Sem cabeçalho de grupo por perto: repete o nome do tipo quando o nome da regra não o diz. */
  comTipo?: boolean;
}

/** Uma regra avaliada: escopo, regra, severidade e `valor ≥ limite` na unidade do tipo. */
export const GateRow: React.FC<GateRowProps> = ({
  resultado,
  escopo,
  esmaecido = false,
  dataHora,
  comTipo = false,
}) => {
  const aguardando = estadoResultado(resultado) === 'aguardando-amostras';
  const estado: EstadoPrincipal = aguardando ? 'aguardando-amostras' : resultado.severidade;
  const alerta = !aguardando && ehSeveridadeAnormal(resultado.severidade);
  const tipo = obterTipoRegra(resultado.tipoRegra);
  // O cabeçalho do grupo já diz o tipo: o nome só aparece quando acrescenta algo.
  const nome = nomeRegraDistinto(resultado.nomeRegra, tipo) ?? (comTipo ? tipo.rotulo : null);
  const metadados = metadadosDoGate(resultado);
  const temValores = !aguardando && resultado.valorObservado !== null && resultado.valorLimite !== null;
  const previsao = ehPrevisao(resultado.tipoRegra) ? lerPrevisao(resultado) : null;
  const horario = previsao && previsao.minutos > 0 ? formatarHorarioPrevisto(dataHora, previsao.minutos) : null;
  // A mensagem do backend traz o decimal com ponto e a unidade dele: na previsão o painel monta a frase.
  const mensagem = ehPrevisao(resultado.tipoRegra)
    ? aguardando
      ? `Aguardando amostras: ${tipo.aguardaQuando.charAt(0).toLowerCase()}${tipo.aguardaQuando.slice(1)}`
      : null
    : resultado.mensagemDiagnostico;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 py-3">
      <p className="min-w-0 text-[15px] text-ink">
        <span className="text-ink-2">{escopo.tipo === 'motor' ? 'Motor' : `Escova ${escopo.numeroEscova}`}</span>
        {nome && (
          <>
            <span aria-hidden="true" className="px-1.5 text-ink-3">
              ·
            </span>
            {nome}
          </>
        )}
      </p>
      <SeverityBadge estado={estado} esmaecido={esmaecido && alerta} />
      {(temValores || mensagem) && (
        <div className="col-span-2 flex flex-wrap items-baseline justify-between gap-x-4 text-[13px]">
          {mensagem && <p className="min-w-0 flex-1 text-ink-2">{mensagem}</p>}
          {previsao && (
            <p className="min-w-0 flex-1 text-ink-2">
              {previsao.minutos === 0
                ? `Deve atingir ${formatarLimitePrevisto(previsao.limiteC)} agora.`
                : `Deve atingir ${formatarLimitePrevisto(previsao.limiteC)}${horario ? ` às ≈ ${horario}` : ''}.`}
            </p>
          )}
          {temValores && previsao && (
            <p className="num ml-auto whitespace-nowrap text-ink-2">
              <span className="text-ink">{formatarMinutos(previsao.minutos)} até {formatarLimitePrevisto(previsao.limiteC)}</span>
              {' · horizonte '}
              {formatarValorGate(resultado.tipoRegra, resultado.valorLimite, 'limite')}
            </p>
          )}
          {temValores && !previsao && (
            <p className="num ml-auto whitespace-nowrap text-ink-2">
              {ehPrevisao(resultado.tipoRegra) ? (
                formatarValorELimite(resultado.tipoRegra, resultado.valorObservado, resultado.valorLimite)
              ) : (
                <>
                  <span className="text-ink">{formatarValorGate(resultado.tipoRegra, resultado.valorObservado)}</span>
                  {' ≥ '}
                  {formatarValorGate(resultado.tipoRegra, resultado.valorLimite, 'limite')}
                </>
              )}
            </p>
          )}
        </div>
      )}
      {metadados.length > 0 && (
        <dl className="num col-span-2 flex flex-wrap gap-x-5 gap-y-0.5 text-xs text-ink-3">
          {metadados.map((item) => (
            <div key={item.rotulo} className="flex gap-1.5">
              <dt>{item.rotulo}</dt>
              <dd className="text-ink-2">{item.valor}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
};
