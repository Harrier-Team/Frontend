import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MotorResponse } from '../types/motor';
import { MotorTelemetria } from '@/features/telemetria/store/tipos';
import { ResumoMotor, resumirEscova } from '@/features/telemetria/helpers/resumoMotor';
import { TEMA_ESTADO } from '@/features/telemetria/helpers/apresentacao';
import { ehSeveridadeAnormal, estaDesatualizado } from '@/features/telemetria/helpers/estadoHelper';
import { formatarGrau } from '@/features/telemetria/helpers/statusHelper';
import { StatusDot } from '@/features/telemetria/components/StatusDot';
import { FrescorIndicador } from '@/features/telemetria/components/FrescorIndicador';
import { ThermalGauge } from '@/features/telemetria/components/ThermalGauge';
import { useLimitesTermicos } from '../hooks/useLimitesTermicos';
import { SEVERIDADE_THEME } from '@/features/quality-gates/helpers/qualityGateHelper';

const marcador: Record<string, string> = {
  Critico: 'var(--color-sev-critico)',
  AlertaPreditivo: 'var(--color-sev-alerta)',
  Atencao: 'var(--color-sev-atencao)',
};

interface MotorRowProps {
  motor: MotorResponse;
  telemetria: MotorTelemetria | undefined;
  resumo: ResumoMotor;
  agora: number;
}

export const MotorRow: React.FC<MotorRowProps> = ({ motor, telemetria, resumo, agora }) => {
  const limites = useLimitesTermicos(motor.id);
  const tema = TEMA_ESTADO[resumo.principal];
  const sensores = [...motor.sensores].sort((a, b) => a.numeroEscova - b.numeroEscova);
  const calmo = resumo.principal === 'Normal';
  const desatualizado = estaDesatualizado(resumo.dado);

  return (
    <Link
      to={`/motores/${motor.id}`}
      className="group relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-4 px-5 py-5 transition-colors hover:bg-raised/70 md:grid-cols-[minmax(200px,0.9fr)_minmax(0,2fr)_minmax(120px,auto)]"
      aria-label={`${motor.nome}, ${tema.label}`}
    >
      {marcador[resumo.principal] && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-[2px]"
          style={{ background: marcador[resumo.principal], opacity: desatualizado ? 0.6 : 1 }}
        />
      )}

      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-[7px]">
          <StatusDot estado={resumo.principal} />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-[15px] text-ink">{motor.nome}</h3>
          <p className="truncate text-[13px] text-ink-2">{motor.tipo}</p>
          <div className="mt-1">
            <FrescorIndicador dado={resumo.dado} ultimoLoteEm={resumo.ultimoLoteEm} agora={agora} />
          </div>
        </div>
      </div>

      <div className="order-3 col-span-2 md:order-none md:col-span-1">
        {sensores.length === 0 ? (
          <p className="text-[13px] text-ink-3">Nenhuma escova vinculada</p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(104px,1fr))] gap-x-6 gap-y-3">
            {sensores.map((sensor) => {
              const serie = telemetria?.escovas[sensor.numeroEscova];
              const valor = serie?.ultima?.valorCelsius ?? null;
              const escova = resumirEscova(serie);
              const anormal = ehSeveridadeAnormal(escova.severidade);
              return (
                <li key={sensor.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-ink-3">Escova {sensor.numeroEscova}</span>
                    <span
                      className="num text-sm"
                      style={{
                        color: anormal
                          ? SEVERIDADE_THEME[escova.severidade!].color
                          : 'var(--color-ink)',
                        opacity: anormal && desatualizado ? 0.6 : 1,
                      }}
                    >
                      {formatarGrau(valor)}
                      <span className="text-ink-3">°</span>
                    </span>
                  </div>
                  <ThermalGauge
                    valor={valor}
                    severidade={escova.severidade}
                    limites={limites}
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
