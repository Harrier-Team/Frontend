import React from 'react';
import {
  ArrowDown,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  CircleX,
  Cpu,
  Database,
  Layers,
  MonitorSmartphone,
  RadioTower,
  Server,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { EstadoEstagio, EstagioPipeline, IdEstagio, ROTULO_ESTAGIO } from '../helpers/pipeline';

const ICONE_ETAPA: Record<IdEstagio, LucideIcon> = {
  esp: Cpu,
  api: Server,
  fila: Layers,
  banco: Database,
  hub: RadioTower,
  painel: MonitorSmartphone,
};

/** Símbolo e cor por estado: a forma comunica o estado mesmo sem cor. */
const MARCA: Record<EstadoEstagio, { Icone: LucideIcon; cor: string }> = {
  ok: { Icone: CircleCheck, cor: 'var(--color-sev-normal)' },
  atencao: { Icone: TriangleAlert, cor: 'var(--color-sev-atencao)' },
  falha: { Icone: CircleX, cor: 'var(--color-sev-critico)' },
  desconhecido: { Icone: CircleHelp, cor: 'var(--color-ink-3)' },
};

const Etapa: React.FC<{ etapa: EstagioPipeline }> = ({ etapa }) => {
  const Icone = ICONE_ETAPA[etapa.id];
  const { Icone: Marca, cor } = MARCA[etapa.estado];
  const anormal = etapa.estado === 'atencao' || etapa.estado === 'falha';
  return (
    <li
      className="flex min-w-0 flex-1 flex-col gap-3 rounded-[var(--radius-panel)] border bg-panel p-4"
      style={{
        borderColor: anormal ? `color-mix(in srgb, ${cor} 55%, var(--color-line))` : 'var(--color-line)',
        background: etapa.estado === 'falha' ? `color-mix(in srgb, ${cor} 7%, var(--color-panel))` : undefined,
      }}
    >
      <div className="flex items-center gap-2 text-ink">
        <Icone className="h-4 w-4 text-ink-3" aria-hidden="true" />
        <h3 className="display text-base">{etapa.nome}</h3>
      </div>
      <p className="flex items-center gap-1.5 text-[13px]" style={{ color: cor }}>
        <Marca className="h-4 w-4 shrink-0" aria-hidden="true" />
        {ROTULO_ESTAGIO[etapa.estado]}
      </p>
      <p className="text-[13px] text-ink-2">{etapa.detalhe}</p>
      <p className="mt-auto text-[13px] text-ink-3">{etapa.explicacao}</p>
    </li>
  );
};

/** ESP → API → Fila → Banco → Hub → Painel, na horizontal em telas largas. */
export const PipelineDiagram: React.FC<{ etapas: EstagioPipeline[] }> = ({ etapas }) => (
  <ol aria-label="Caminho dos dados" className="flex flex-col items-stretch gap-1 xl:flex-row xl:items-stretch xl:gap-0">
    {etapas.map((etapa, i) => (
      <React.Fragment key={etapa.id}>
        <Etapa etapa={etapa} />
        {i < etapas.length - 1 && (
          <li aria-hidden="true" className="flex shrink-0 items-center justify-center py-0.5 text-ink-3 xl:px-1.5 xl:py-0">
            <ArrowDown className="h-4 w-4 xl:hidden" />
            <ChevronRight className="hidden h-4 w-4 xl:block" />
          </li>
        )}
      </React.Fragment>
    ))}
  </ol>
);
