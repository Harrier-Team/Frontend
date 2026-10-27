import React from 'react';
import { SensorComTelemetria } from '@/features/telemetria/types/telemetria';
import {
  STATUS_THEME,
  formatarGrau,
  formatarRelativo,
} from '@/features/telemetria/helpers/statusHelper';
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

      <div className="mt-5 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <p
          className="display num text-[40px] leading-none"
          style={{ color: destaque ? tema.color : 'var(--color-ink)' }}
        >
          {formatarGrau(temperatura)}
          <span className="ml-1 text-lg text-ink-3">°C</span>
        </p>
        <div className="flex flex-col gap-1 text-xs text-ink-3 sm:items-end">
            <span className="num">
              {sensor.ultimaLeitura
                ? `Atualizado ${formatarRelativo(sensor.ultimaLeitura.dataHora)}`
                : 'Sem leitura'}
            </span>
            <span className="num">{sensor.ipAtual ?? 'Sem IP'}</span>
        </div>
      </div>

      {sensor.status === 'sem_avaliacao' && (
        <p className="mt-3 text-xs text-ink-3">
          {sensor.ultimaLeitura
            ? 'Nenhum resultado de Quality Gate disponível para classificar esta leitura.'
            : 'Aguardando leitura e avaliação dos Quality Gates.'}
        </p>
      )}

      {sensor.ultimaLeitura && (
        <QualityGateResultList resultados={sensor.ultimaLeitura.resultadosQualityGates} />
      )}
    </article>
  );
};
