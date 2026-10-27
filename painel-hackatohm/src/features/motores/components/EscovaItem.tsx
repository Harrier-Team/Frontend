import React from 'react';
import { SensorResponse } from '../types/motor';
import { SerieEscova } from '@/features/telemetria/store/tipos';
import { resumirEscova } from '@/features/telemetria/helpers/resumoMotor';
import { TEMA_ESTADO } from '@/features/telemetria/helpers/apresentacao';
import {
  EstadoDado,
  ehSeveridadeAnormal,
  estaDesatualizado,
  estadoPrincipal,
} from '@/features/telemetria/helpers/estadoHelper';
import { formatarGrau, formatarRelativo } from '@/features/telemetria/helpers/statusHelper';
import { ThermalGauge } from '@/features/telemetria/components/ThermalGauge';
import { StatusDot } from '@/features/telemetria/components/StatusDot';
import { QualityGateResultList } from '@/features/quality-gates/components/QualityGateResultList';
import { ParametrosRegra } from '@/features/quality-gates/types/regraQualidade';

interface EscovaItemProps {
  sensor: SensorResponse;
  serie: SerieEscova | undefined;
  dado: EstadoDado;
  agora: number;
  limites?: ParametrosRegra | null;
}

export const EscovaItem: React.FC<EscovaItemProps> = ({ sensor, serie, dado, agora, limites }) => {
  const ultima = serie?.ultima ?? null;
  const { severidade, avaliacao } = resumirEscova(serie);
  const estado = estadoPrincipal(severidade, avaliacao, 'ao-vivo');
  const tema = TEMA_ESTADO[estado];
  const temperatura = ultima?.valorCelsius ?? null;
  const destaque = ehSeveridadeAnormal(severidade);
  const desatualizado = estaDesatualizado(dado);

  return (
    <article className="px-5 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <StatusDot estado={estado} />
          <h3 className="text-[15px] text-ink">Escova {sensor.numeroEscova}</h3>
          <span className="text-[13px] text-ink-3">{sensor.modelo}</span>
        </div>
        {estado !== 'Normal' && <span className={`text-[13px] ${tema.textClass}`}>{tema.label}</span>}
      </div>

      <div className="mt-5 grid items-end gap-x-10 gap-y-4 sm:grid-cols-[180px_minmax(0,1fr)]">
        <p
          className="display num text-[40px] leading-none"
          style={{
            color: destaque ? tema.color : 'var(--color-ink)',
            opacity: destaque && desatualizado ? 0.6 : 1,
          }}
        >
          {formatarGrau(temperatura)}
          <span className="ml-1 text-lg text-ink-3">°C</span>
        </p>
        <div className="pb-1">
          <ThermalGauge
            valor={temperatura}
            severidade={severidade}
            limites={limites}
            label={`Temperatura da escova ${sensor.numeroEscova}`}
          />
          <div className="mt-1 flex justify-between text-xs text-ink-3">
            <span className="num">
              {ultima
                ? `Atualizado ${formatarRelativo(ultima.dataHora, agora)}${
                    desatualizado ? ' · desatualizado' : ''
                  }`
                : 'Sem leitura'}
            </span>
            <span className="num">{sensor.ipAtual ?? 'Sem IP'}</span>
          </div>
        </div>
      </div>

      {ultima && <QualityGateResultList resultados={ultima.resultadosQualityGates} />}
    </article>
  );
};
