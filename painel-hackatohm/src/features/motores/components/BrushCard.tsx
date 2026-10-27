import React from 'react';
import { SerieEscova } from '@/features/telemetria/store/tipos';
import { resumirEscova } from '@/features/telemetria/helpers/resumoMotor';
import { TEMA_ESTADO } from '@/features/telemetria/helpers/apresentacao';
import {
  EstadoDado,
  ehSeveridadeAnormal,
  estaDesatualizado,
  estadoPrincipal,
} from '@/features/telemetria/helpers/estadoHelper';
import { gradienteDaEscova } from '@/features/telemetria/helpers/valorRegra';
import { formatarGrau, formatarRelativo } from '@/features/telemetria/helpers/statusHelper';
import { SeverityBadge } from '@/features/telemetria/components/SeverityBadge';
import { SeveritySymbol } from '@/features/telemetria/components/SeveritySymbol';
import { Sparkline } from '@/features/telemetria/components/Sparkline';
import { ThermalGauge } from '@/features/telemetria/components/ThermalGauge';
import { Metric } from '@/components/ui/Metric';
import { TIPO_GRADIENTE } from '@/features/quality-gates/helpers/tiposRegra';
import { ParametrosRegra } from '@/features/quality-gates/types/regraQualidade';
import { estadoResultado } from '@/features/telemetria/helpers/estadoHelper';

interface BrushCardProps {
  numeroEscova: number;
  modelo?: string;
  serie: SerieEscova | undefined;
  dado: EstadoDado;
  agora: number;
  limites: ParametrosRegra | null;
}

function formatarGradiente(valor: number): string {
  const sinal = valor > 0 ? '+' : valor < 0 ? '−' : '';
  return `${sinal}${formatarGrau(Math.abs(valor))} °C/min`;
}

/** Cartão da escova: temperatura, gradiente, sparkline da sessão e o medidor da regra do motor. */
export const BrushCard: React.FC<BrushCardProps> = ({ numeroEscova, modelo, serie, dado, agora, limites }) => {
  const ultima = serie?.ultima ?? null;
  const { severidade, avaliacao } = resumirEscova(serie);
  const estado = estadoPrincipal(severidade, avaliacao, 'ao-vivo');
  const anormal = ehSeveridadeAnormal(severidade);
  const desatualizado = estaDesatualizado(dado);
  const tema = TEMA_ESTADO[estado];

  const gateGradiente = ultima?.resultadosQualityGates.find((g) => g.tipoRegra === TIPO_GRADIENTE);
  const gradienteDoGate =
    gateGradiente && estadoResultado(gateGradiente) === 'avaliado' ? gateGradiente.valorObservado : null;
  const gradiente = gradienteDoGate ?? gradienteDaEscova(serie);
  const gradienteAnormal =
    gateGradiente && estadoResultado(gateGradiente) === 'avaliado' && gateGradiente.severidade !== 'Normal';

  const cor = anormal ? tema.color : undefined;
  const barra = estado === 'Critico' || estado === 'AlertaPreditivo' ? tema.color : null;

  return (
    <article
      aria-label={`Escova ${numeroEscova}`}
      className="relative flex flex-col gap-4 overflow-hidden rounded-[var(--radius-panel)] border border-line bg-panel p-4"
      style={{
        background:
          estado === 'Critico'
            ? 'color-mix(in srgb, var(--color-sev-critico) 7%, var(--color-panel))'
            : undefined,
      }}
    >
      {barra && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{ background: barra, opacity: desatualizado ? 0.6 : 1 }}
        />
      )}
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[15px] text-ink">Escova {numeroEscova}</h3>
          {modelo && <p className="truncate text-xs text-ink-3">{modelo}</p>}
        </div>
        {(anormal || avaliacao === 'aguardando-amostras' || avaliacao === 'sem-regras') && (
          <SeverityBadge estado={estado} compacto esmaecido={desatualizado} />
        )}
      </header>

      <Metric
        rotulo="Temperatura"
        tamanho="lg"
        valor={ultima ? formatarGrau(ultima.valorCelsius) : '—'}
        unidade="°C"
        cor={desatualizado && !anormal ? 'var(--color-ink-2)' : cor}
        esmaecido={anormal && desatualizado}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="num flex items-center gap-1.5 text-[13px] text-ink-2">
          {gradiente !== null ? (
            <>
              {gradienteAnormal && gateGradiente && (
                <SeveritySymbol estado={gateGradiente.severidade} size={14} decorativo />
              )}
              <span className="sr-only">Variação:</span>
              {formatarGradiente(gradiente)}
            </>
          ) : (
            <span className="text-ink-3">Variação: aguardando 2 leituras</span>
          )}
        </p>
        <Sparkline
          valores={(serie?.pontos ?? []).slice(-40).map((p) => p.v)}
          esmaecido={desatualizado}
          descricao={`Temperatura da escova ${numeroEscova} nesta sessão`}
        />
      </div>

      <ThermalGauge
        valor={ultima?.valorCelsius}
        limites={limites}
        cor={anormal ? tema.color : undefined}
        label={`Temperatura da escova ${numeroEscova}`}
      />

      <p className="num text-xs text-ink-3">
        {ultima ? (
          <>
            Atualizado {formatarRelativo(ultima.dataHora, agora)}
            {desatualizado && ' · desatualizado'}
          </>
        ) : (
          'Sem leitura'
        )}
      </p>
    </article>
  );
};
