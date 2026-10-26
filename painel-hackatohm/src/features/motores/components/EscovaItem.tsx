import React from 'react';
import { SensorComTelemetria } from '@/features/telemetria/types/telemetria';
import {
  STATUS_THEME,
  formatarGrau,
  formatarRelativo,
} from '@/features/telemetria/helpers/statusHelper';
import { ThermalGauge } from '@/features/telemetria/components/ThermalGauge';
import { StatusDot } from '@/features/telemetria/components/StatusDot';
import { QualityGateResultList } from '@/features/quality-gates/components/QualityGateResultList';

export const EscovaItem: React.FC<{ sensor: SensorComTelemetria }> = ({ sensor }) => {
  const tema = STATUS_THEME[sensor.status];
  const temperatura = sensor.ultimaLeitura?.valorCelsius ?? null;
  const destaque = sensor.status === 'warning' || sensor.status === 'perigo';

  return (
    <article className="px-5 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <StatusDot status={sensor.status} />
          <h3 className="text-[15px] text-ink">Escova {sensor.numeroEscova}</h3>
          <span className="break-all text-[13px] text-ink-3">{sensor.modelo}</span>
        </div>
        <span className={`status-pill ${sensor.status === 'normal' ? 'text-ok' : tema.textClass}`}>{tema.label}</span>
      </div>

      <div className="mt-5 grid items-end gap-x-10 gap-y-4 sm:grid-cols-[180px_minmax(0,1fr)]">
        <p
          className="display num text-[40px] leading-none"
          style={{ color: destaque ? tema.color : 'var(--color-ink)' }}
        >
          {formatarGrau(temperatura)}
          <span className="ml-1 text-lg text-ink-3">°C</span>
        </p>
        <div className="pb-1">
          <ThermalGauge
            valor={temperatura}
            status={sensor.status}
            label={`Temperatura da escova ${sensor.numeroEscova}`}
          />
          <div className="mt-1 flex justify-between text-xs text-ink-3">
            <span className="num">
              {sensor.ultimaLeitura
                ? `Atualizado ${formatarRelativo(sensor.ultimaLeitura.dataHora)}`
                : 'Sem leitura'}
            </span>
            <span className="num">{sensor.ipAtual ?? 'Sem IP'}</span>
          </div>
        </div>
      </div>

      {sensor.ultimaLeitura && (
        <QualityGateResultList resultados={sensor.ultimaLeitura.resultadosQualityGates} />
      )}
    </article>
  );
};
