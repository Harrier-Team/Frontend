import React from 'react';
import { Cpu, CheckCircle2, AlertTriangle, Flame } from 'lucide-react';
import { NivelStatus } from '../types/telemetria';

interface KpiStatsBarProps {
  kpis: {
    totalMotores: number;
    normais: number;
    atencao: number;
    perigo: number;
    offline: number;
    totalSensores: number;
  };
  filtroAtivo: NivelStatus | 'todos';
  onSelecionarFiltro: (filtro: NivelStatus | 'todos') => void;
}

export const KpiStatsBar: React.FC<KpiStatsBarProps> = ({
  kpis,
  filtroAtivo,
  onSelecionarFiltro,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {/* Total de Motores */}
      <button
        type="button"
        onClick={() => onSelecionarFiltro('todos')}
        className={`p-4 rounded-xl border text-left transition bg-white shadow-xs hover:shadow-md ${
          filtroAtivo === 'todos'
            ? 'ring-2 ring-indigo-500 border-indigo-200'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total de Motores
          </span>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Cpu className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-black text-slate-900">{kpis.totalMotores}</span>
          <span className="text-xs text-slate-500">
            ({kpis.totalSensores} escovas)
          </span>
        </div>
      </button>

      {/* Operando Normal */}
      <button
        type="button"
        onClick={() => onSelecionarFiltro('normal')}
        className={`p-4 rounded-xl border text-left transition bg-white shadow-xs hover:shadow-md ${
          filtroAtivo === 'normal'
            ? 'ring-2 ring-emerald-500 border-emerald-300'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Operando Normal
          </span>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-black text-emerald-700">{kpis.normais}</span>
          <span className="text-xs text-emerald-600 font-medium">
            {kpis.totalMotores > 0
              ? `${Math.round((kpis.normais / kpis.totalMotores) * 100)}%`
              : '0%'}
          </span>
        </div>
      </button>

      {/* Em Atenção / Warning */}
      <button
        type="button"
        onClick={() => onSelecionarFiltro('warning')}
        className={`p-4 rounded-xl border text-left transition bg-white shadow-xs hover:shadow-md ${
          filtroAtivo === 'warning'
            ? 'ring-2 ring-amber-500 border-amber-300'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
            Atenção (60-79°C)
          </span>
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-black text-amber-700">{kpis.atencao}</span>
          <span className="text-xs text-amber-600">requer observação</span>
        </div>
      </button>

      {/* Perigo / Desgaste */}
      <button
        type="button"
        onClick={() => onSelecionarFiltro('perigo')}
        className={`p-4 rounded-xl border text-left transition bg-white shadow-xs hover:shadow-md ${
          kpis.perigo > 0 ? 'bg-rose-50/50' : ''
        } ${
          filtroAtivo === 'perigo'
            ? 'ring-2 ring-rose-500 border-rose-300'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 flex items-center gap-1">
            {kpis.perigo > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
            Perigo / Desgaste (≥80°C)
          </span>
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-black text-rose-700">{kpis.perigo}</span>
          <span className="text-xs text-rose-600 font-semibold">
            {kpis.perigo > 0 ? 'AÇÃO IMEDIATA' : 'Nenhum alerta'}
          </span>
        </div>
      </button>
    </div>
  );
};
