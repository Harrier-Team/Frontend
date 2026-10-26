import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MotorComStatus } from '@/features/telemetria/types/telemetria';
import { STATUS_THEME, formatarGrau } from '@/features/telemetria/helpers/statusHelper';
import { StatusDot } from '@/features/telemetria/components/StatusDot';
import { ThermalGauge } from '@/features/telemetria/components/ThermalGauge';

const marcador: Record<string, string> = {
  perigo: 'var(--color-hot)',
  warning: 'var(--color-warn)',
};

export const MotorRow: React.FC<{ motor: MotorComStatus }> = ({ motor }) => {
  const tema = STATUS_THEME[motor.statusGeral];
  const sensores = [...motor.sensores].sort((a, b) => a.numeroEscova - b.numeroEscova);
  const calmo = motor.statusGeral === 'normal';

  return (
    <Link
      to={`/motores/${motor.id}`}
      className="group relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-4 px-5 py-5 transition-colors hover:bg-raised/70 md:grid-cols-[minmax(200px,0.9fr)_minmax(0,2fr)_104px]"
      aria-label={`${motor.nome}, ${tema.label}`}
    >
      {marcador[motor.statusGeral] && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-[2px]"
          style={{ background: marcador[motor.statusGeral] }}
        />
      )}

      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-[7px]">
          <StatusDot status={motor.statusGeral} />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-[15px] text-ink">{motor.nome}</h3>
          <p className="truncate text-[13px] text-ink-2">{motor.tipo}</p>
        </div>
      </div>

      <div className="order-3 col-span-2 md:order-none md:col-span-1">
        {sensores.length === 0 ? (
          <p className="text-[13px] text-ink-3">Nenhuma escova vinculada</p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(104px,1fr))] gap-x-6 gap-y-3">
            {sensores.map((sensor) => {
              const valor = sensor.ultimaLeitura?.valorCelsius ?? null;
              return (
                <li key={sensor.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-ink-3">Escova {sensor.numeroEscova}</span>
                    <span
                      className="num text-sm"
                      style={{
                        color: sensor.status === 'normal' || sensor.status === 'offline'
                          ? 'var(--color-ink)'
                          : STATUS_THEME[sensor.status].color,
                      }}
                    >
                      {formatarGrau(valor)}
                      <span className="text-ink-3">°</span>
                    </span>
                  </div>
                  <ThermalGauge
                    valor={valor}
                    status={sensor.status}
                    label={`Escova ${sensor.numeroEscova} de ${motor.nome}`}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 md:order-none">
        {!calmo && <span className={`text-[13px] ${tema.textClass}`}>{tema.label}</span>}
        <ChevronRight
          className="h-4 w-4 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
};
