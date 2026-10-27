import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MotorResponse } from '../types/motor';
import { MotorTelemetria } from '@/features/telemetria/store/tipos';
import { ResumoMotor, resumirEscova } from '@/features/telemetria/helpers/resumoMotor';
import { TEMA_ESTADO } from '@/features/telemetria/helpers/apresentacao';
import {
  EstadoPrincipal,
  ehSeveridadeAnormal,
  estaDesatualizado,
} from '@/features/telemetria/helpers/estadoHelper';
import {
  deltaTDasUltimas,
  motivoDoMotor,
  rotuloCurtoDoMotivo,
  serieDaMaiorTemperatura,
} from '@/features/telemetria/helpers/linhaMotor';
import { formatarGrau } from '@/features/telemetria/helpers/statusHelper';
import { SeveritySymbol } from '@/features/telemetria/components/SeveritySymbol';
import { SeverityBadge } from '@/features/telemetria/components/SeverityBadge';
import { FreshnessIndicator } from '@/features/telemetria/components/FreshnessIndicator';
import { Sparkline } from '@/features/telemetria/components/Sparkline';
import { SEVERIDADE_THEME } from '@/features/quality-gates/helpers/qualityGateHelper';

const COR_BARRA: Partial<Record<EstadoPrincipal, string>> = {
  Critico: 'var(--color-sev-critico)',
  AlertaPreditivo: 'var(--color-sev-alerta)',
};

interface MotorRowProps {
  motor: MotorResponse;
  telemetria: MotorTelemetria | undefined;
  resumo: ResumoMotor;
  agora: number;
}

export const MotorRow: React.FC<MotorRowProps> = ({ motor, telemetria, resumo, agora }) => {
  const sensores = [...motor.sensores].sort((a, b) => a.numeroEscova - b.numeroEscova);
  const desatualizado = estaDesatualizado(resumo.dado);
  const offline = resumo.dado === 'offline';
  const principal = resumo.principal;
  const tema = TEMA_ESTADO[principal];
  const motivo = ehSeveridadeAnormal(resumo.severidade) ? motivoDoMotor(telemetria, resumo.motivo) : null;
  const sparkline = serieDaMaiorTemperatura(telemetria?.escovas);
  const deltaT = deltaTDasUltimas(telemetria?.escovas);

  // Mudança de estado: o fundo tingido pisca uma vez (600 ms). Estado derivado
  // durante a renderização, sem efeito.
  const [anterior, setAnterior] = useState(principal);
  const [pulso, setPulso] = useState(0);
  if (anterior !== principal) {
    setAnterior(principal);
    setPulso((n) => n + 1);
  }
  const corPulso =
    COR_BARRA[principal] ?? (principal === 'Atencao' ? 'var(--color-sev-atencao)' : 'var(--color-flare)');

  return (
    <Link
      to={`/motores/${motor.id}`}
      aria-label={`${motor.nome}, ${tema.label}`}
      className="group relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-3 px-5 py-4 transition-colors hover:bg-raised/70 md:grid-cols-[minmax(190px,1.1fr)_minmax(0,1.7fr)_80px_72px_minmax(120px,auto)_16px]"
      style={{
        background:
          principal === 'Critico'
            ? 'color-mix(in srgb, var(--color-sev-critico) 7%, var(--color-panel))'
            : undefined,
      }}
    >
      {COR_BARRA[principal] && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{ background: COR_BARRA[principal], opacity: desatualizado ? 0.6 : 1 }}
        />
      )}
      {pulso > 0 && (
        <span
          key={pulso}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `color-mix(in srgb, ${corPulso} 14%, transparent)`,
            animation: 'linha-pisca 600ms var(--ease-out) forwards',
          }}
        />
      )}

      {/* Identidade */}
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5">
          <SeveritySymbol estado={principal} size={18} esmaecido={desatualizado} />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-[15px] text-ink">{motor.nome}</h3>
          <p className="truncate text-[13px] text-ink-3">
            {motor.tipo}
            {motivo && (
              <>
                <span aria-hidden="true"> · </span>
                <span className="text-ink-2">{rotuloCurtoDoMotivo(motivo)}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Estado, à direita no mobile; coluna própria no desktop */}
      <div className="flex flex-col items-end gap-1 md:order-5">
        <SeverityBadge estado={principal} compacto tingido esmaecido={desatualizado} />
        <FreshnessIndicator dado={resumo.dado} ultimoLoteEm={resumo.ultimoLoteEm} agora={agora} compacto />
      </div>

      {/* Temperaturas por escova */}
      <ul className="order-3 col-span-2 flex flex-wrap gap-x-5 gap-y-1 md:order-2 md:col-span-1">
        {sensores.length === 0 ? (
          <li className="text-[13px] text-ink-3">Nenhuma escova vinculada</li>
        ) : (
          sensores.map((sensor) => {
            const serie = telemetria?.escovas[sensor.numeroEscova];
            const valor = serie?.ultima?.valorCelsius ?? null;
            const escova = resumirEscova(serie);
            const anormal = ehSeveridadeAnormal(escova.severidade);
            const cor = anormal
              ? SEVERIDADE_THEME[escova.severidade!].color
              : offline
                ? 'var(--color-ink-3)'
                : desatualizado
                  ? 'var(--color-ink-2)'
                  : 'var(--color-ink)';
            return (
              <li key={sensor.id} className="flex items-baseline gap-1.5">
                <span className="text-xs text-ink-3">E{sensor.numeroEscova}</span>
                <span
                  className="num inline-flex items-center gap-1 text-[15px]"
                  style={{ color: cor, opacity: anormal && desatualizado ? 0.6 : 1 }}
                >
                  {anormal && <SeveritySymbol estado={escova.severidade!} size={13} decorativo />}
                  <span className="sr-only">Escova {sensor.numeroEscova}:</span>
                  {formatarGrau(valor).replace('--', '—')}
                  {valor !== null && <span className="text-xs text-ink-3">°C</span>}
                </span>
              </li>
            );
          })
        )}
      </ul>

      {/* Tendência e ΔT: só no desktop; no mobile a linha ficaria mais alta que útil */}
      <div className="order-4 hidden md:block">
        {sparkline.length > 1 ? (
          <Sparkline
            valores={sparkline}
            esmaecido={desatualizado}
            descricao={`Maior temperatura nesta sessão, de ${formatarGrau(sparkline[0])} a ${formatarGrau(
              sparkline[sparkline.length - 1]
            )} °C`}
          />
        ) : (
          <span className="text-[13px] text-ink-3">sem dados</span>
        )}
      </div>
      <p
        className="num order-4 hidden text-[13px] text-ink-2 md:block"
        title="Diferença entre a escova mais quente e a mais fria"
      >
        {deltaT !== null ? (
          <>
            <span className="text-ink-3">ΔT </span>
            {formatarGrau(deltaT)}
          </>
        ) : null}
      </p>

      <ChevronRight
        className="order-6 hidden h-4 w-4 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-ink md:block"
        aria-hidden="true"
      />
    </Link>
  );
};
