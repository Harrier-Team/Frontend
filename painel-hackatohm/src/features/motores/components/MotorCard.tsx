import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MotorComStatus } from '@/features/telemetria/types/telemetria';
import { STATUS_THEME, formatarTemperatura } from '@/features/telemetria/helpers/statusHelper';
import { Panel } from '@/components/ui/Panel';
import { EscovaItem } from './EscovaItem';

export const MotorCard: React.FC<{ motor: MotorComStatus }> = ({ motor }) => {
  const tema = STATUS_THEME[motor.statusGeral];
  return (
    <Panel>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="display truncate text-base">{motor.nome}</h3>
            <p className="mt-1 text-xs text-ink-2">{motor.tipo}</p>
          </div>
          <span className={`status-pill ${motor.statusGeral === 'normal' ? 'text-ok' : tema.textClass}`}>{tema.label}</span>
        </div>
        <div className="flex flex-wrap justify-between gap-3 rounded-lg bg-raised p-3 text-xs text-ink-2">
          <span>Maior leitura <strong className="num ml-1 text-ink">{formatarTemperatura(motor.temperaturaMaxima)}</strong></span>
          <span>{motor.sensores.length} escovas vinculadas</span>
        </div>
      </div>
      {motor.sensores.map((sensor) => <EscovaItem key={sensor.id} sensor={sensor} />)}
      <Link to={`/motores/${motor.id}`} className="flex min-h-11 items-center justify-between gap-2 px-5 py-3 text-xs text-ink-2 hover:bg-raised hover:text-ink">
        Ver detalhes <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </Panel>
  );
};
