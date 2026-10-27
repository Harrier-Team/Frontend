import React from 'react';
import { SerieEscova } from '@/features/telemetria/store/tipos';
import { GrupoDiagnostico } from '@/features/telemetria/helpers/diagnosticos';
import { EstadoDado, estaDesatualizado, estadoResultado } from '@/features/telemetria/helpers/estadoHelper';
import { extremosDoLote } from '@/features/telemetria/helpers/valorRegra';
import { formatarGrau } from '@/features/telemetria/helpers/statusHelper';
import { SeverityBadge } from '@/features/telemetria/components/SeverityBadge';
import { Metric } from '@/components/ui/Metric';
import { SEVERIDADE_THEME } from '@/features/quality-gates/helpers/qualityGateHelper';

interface MotorAsymmetryCardProps {
  escovas: Record<number, SerieEscova> | undefined;
  /** Grupo de diagnóstico da regra de assimetria (resultado único, no escopo do motor). */
  grupo: GrupoDiagnostico | undefined;
  dado: EstadoDado;
}

/**
 * A assimetria pertence ao motor, não a uma escova: o backend repete o mesmo
 * resultado em todas, e aqui ele aparece uma vez, com as escovas extremas.
 */
export const MotorAsymmetryCard: React.FC<MotorAsymmetryCardProps> = ({ escovas, grupo, dado }) => {
  const extremos = extremosDoLote(escovas);
  const resultado = grupo?.itens[0]?.resultado;
  const avaliado = resultado ? estadoResultado(resultado) === 'avaliado' : false;
  const severidade = avaliado ? resultado!.severidade : null;
  const anormal = severidade !== null && severidade !== 'Normal';
  const desatualizado = estaDesatualizado(dado);
  const valor = avaliado && resultado!.valorObservado !== null ? resultado!.valorObservado : extremos?.diferenca ?? null;

  return (
    <article
      aria-label="Motor, assimetria entre escovas"
      className="relative flex flex-col gap-4 overflow-hidden rounded-[var(--radius-panel)] border border-line bg-panel p-4"
    >
      {anormal && severidade !== 'Atencao' && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{ background: SEVERIDADE_THEME[severidade!].color, opacity: desatualizado ? 0.6 : 1 }}
        />
      )}
      <header className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[15px] text-ink">Motor</h3>
          <p className="text-xs text-ink-3">Assimetria entre escovas</p>
        </div>
        {grupo &&
          (grupo.aguardando ? (
            <SeverityBadge estado="aguardando-amostras" compacto />
          ) : anormal ? (
            <SeverityBadge estado={severidade!} compacto esmaecido={desatualizado} />
          ) : null)}
      </header>

      <Metric
        rotulo="Diferença entre a mais quente e a mais fria"
        tamanho="lg"
        valor={valor !== null ? formatarGrau(valor) : '—'}
        unidade="°C"
        cor={anormal ? SEVERIDADE_THEME[severidade!].color : desatualizado ? 'var(--color-ink-2)' : undefined}
        esmaecido={anormal && desatualizado}
      />

      <p className="num text-[13px] text-ink-2">
        {extremos ? (
          <>
            E{extremos.maisQuente.numeroEscova} {formatarGrau(extremos.maisQuente.valor)} ·{' '}
            E{extremos.maisFria.numeroEscova} {formatarGrau(extremos.maisFria.valor)}
          </>
        ) : (
          <span className="text-ink-3">Precisa de pelo menos duas escovas com leitura</span>
        )}
      </p>
      {!grupo && (
        <p className="text-xs text-ink-3">Sem regra de assimetria vinculada: só a diferença é mostrada.</p>
      )}
    </article>
  );
};
