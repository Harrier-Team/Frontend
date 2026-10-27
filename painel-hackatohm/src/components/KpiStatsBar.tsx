import React from 'react';
import { ArrowUpRight, Cpu, CheckCircle2, AlertTriangle, Flame, Radio, CircleHelp } from 'lucide-react';
import { NivelStatus } from '@/features/telemetria/types/telemetria';

interface KpiStatsBarProps {
  kpis: { totalMotores: number; normais: number; atencao: number; perigo: number; semAvaliacao: number; offline: number; totalSensores: number };
  filtroAtivo: NivelStatus | 'todos';
  onSelecionarFiltro: (filtro: NivelStatus | 'todos') => void;
  indisponivel?: boolean;
}

export const KpiStatsBar: React.FC<KpiStatsBarProps> = ({ kpis, filtroAtivo, onSelecionarFiltro, indisponivel }) => {
  const indicadores = [
    { filtro: 'todos' as const, label: 'Motores', valor: kpis.totalMotores, detalhe: `${kpis.totalSensores} escovas vinculadas`, Icon: Cpu, cor: 'text-ink' },
    { filtro: 'normal' as const, label: 'Estáveis', valor: kpis.normais, detalhe: 'Quality Gates sem alertas', Icon: CheckCircle2, cor: 'text-ok' },
    { filtro: 'warning' as const, label: 'Em atenção', valor: kpis.atencao, detalhe: 'Requerem acompanhamento', Icon: AlertTriangle, cor: 'text-warn' },
    { filtro: 'perigo' as const, label: 'Críticos', valor: kpis.perigo, detalhe: 'Prioridade de verificação', Icon: Flame, cor: 'text-hot' },
    { filtro: 'sem_avaliacao' as const, label: 'Sem avaliação', valor: kpis.semAvaliacao, detalhe: 'Sem resultado dos Quality Gates', Icon: CircleHelp, cor: 'text-ink-2' },
    { filtro: 'offline' as const, label: 'Sem sinal', valor: kpis.offline, detalhe: 'Aguardando comunicação', Icon: Radio, cor: 'text-ink-2' },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6" role="group" aria-label="Filtrar motores por estado">
      {indicadores.map(({ filtro, label, valor, detalhe, Icon, cor }) => (
        <button key={filtro} type="button" aria-pressed={filtroAtivo === filtro} disabled={indisponivel}
          onClick={() => onSelecionarFiltro(filtroAtivo === filtro ? 'todos' : filtro)}
          className={`group relative min-w-0 rounded-xl border bg-panel p-4 text-left transition-colors disabled:cursor-default sm:p-5 ${filtroAtivo === filtro ? 'border-ink-3 bg-raised/70' : 'border-line hover:border-line-strong hover:bg-raised/50'}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-ink-2">{label}</span>
            <Icon className={`h-4 w-4 ${cor}`} aria-hidden="true" />
          </div>
          <div className={`num mt-4 text-[32px] font-medium leading-none ${cor}`}>{indisponivel ? '—' : valor}</div>
          <p className="mt-2 text-[11px] text-ink-3">{indisponivel ? 'Dados indisponíveis' : detalhe}</p>
          <ArrowUpRight className="absolute bottom-4 right-3 hidden h-3 w-3 text-ink-3 group-hover:block" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
};
