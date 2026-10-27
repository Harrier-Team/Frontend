import React from 'react';
import { MotorResponse } from '../types/motor';
import { MotorTelemetria } from '@/features/telemetria/store/tipos';
import { cadenciaMediana } from '@/features/telemetria/helpers/grafico';
import { formatarHora } from '@/features/telemetria/helpers/statusHelper';
import { CopyableCode } from '@/components/ui/CopyableCode';
import { Panel } from '@/components/ui/Panel';

interface DispositivoMotorProps {
  motor: MotorResponse;
  telemetria: MotorTelemetria | undefined;
  mac: string | null;
}

function formatarCadencia(ms: number): string {
  return `${(ms / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s`;
}

const Item: React.FC<{ rotulo: string; children: React.ReactNode }> = ({ rotulo, children }) => (
  <div>
    <dt className="text-[13px] text-ink-3">{rotulo}</dt>
    <dd className="mt-1 text-[15px] text-ink">{children}</dd>
  </div>
);

/** Aba Dispositivo: o ESP e os sensores do motor, e a saúde do envio nesta sessão. */
export const DispositivoMotor: React.FC<DispositivoMotorProps> = ({ motor, telemetria, mac }) => {
  const sensores = [...motor.sensores].sort((a, b) => a.numeroEscova - b.numeroEscova);
  const primeira = Object.values(telemetria?.escovas ?? {}).find((s) => s.pontos.length > 1);
  const cadencia = primeira ? cadenciaMediana(primeira.pontos) : null;
  const lotes = telemetria?.lotesNaSessao ?? 0;

  return (
    <div className="space-y-8">
      <section aria-labelledby="esp" className="space-y-4">
        <h2 id="esp" className="display text-base">
          ESP
        </h2>
        <dl className="grid gap-x-8 gap-y-5 rounded-[var(--radius-panel)] border border-line bg-panel p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Item rotulo="MAC do ESP">
            {mac ? (
              <CopyableCode texto={mac} rotulo="MAC do ESP" />
            ) : (
              <span className="text-[13px] text-ink-3">Aparece quando o primeiro lote chegar</span>
            )}
          </Item>
          <Item rotulo="Último lote">
            <span className="num">{telemetria?.ultimoLoteEm ? formatarHora(telemetria.ultimoLoteEm) : '—'}</span>
          </Item>
          <Item rotulo="Cadência medida">
            <span className="num">{cadencia !== null ? formatarCadencia(cadencia) : '—'}</span>
            <span className="ml-2 text-[13px] text-ink-3">referência ~10 s</span>
          </Item>
          <Item rotulo="Lotes nesta sessão">
            <span className="num">{lotes}</span>
          </Item>
        </dl>
      </section>

      <section aria-labelledby="sensores" className="space-y-4">
        <h2 id="sensores" className="display text-base">
          Sensores<span className="num ml-2 text-ink-3">{sensores.length}</span>
        </h2>
        {sensores.length === 0 ? (
          <p className="text-sm text-ink-3">Nenhum sensor vinculado a este motor.</p>
        ) : (
          <Panel>
            {sensores.map((sensor) => (
              <div
                key={sensor.id}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-5 gap-y-2 px-5 py-4 md:grid-cols-[80px_140px_minmax(0,1.4fr)_120px_minmax(0,1fr)]"
              >
                <p className="text-[15px] text-ink">Escova {sensor.numeroEscova}</p>
                <p className="text-[13px] text-ink-2">{sensor.modelo}</p>
                <div className="col-span-2 min-w-0 md:col-span-1">
                  <CopyableCode texto={sensor.id} rotulo={`ID do sensor da escova ${sensor.numeroEscova}`} />
                </div>
                <p className="num text-[13px] text-ink-2">{sensor.ipAtual ?? 'Sem IP'}</p>
                <p className="num text-[13px] text-ink-3">
                  Último ping: {sensor.ultimaConexao ? formatarHora(sensor.ultimaConexao) : '—'}
                </p>
              </div>
            ))}
          </Panel>
        )}
      </section>
    </div>
  );
};
