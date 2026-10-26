import React, { useState } from 'react';
import { Trash2, AlertTriangle, ShieldCheck, Flame, Radio } from 'lucide-react';
import { MotorComStatus } from '../types/telemetria';
import { STATUS_THEME, formatarTemperatura } from '../utils/statusHelper';
import { EscovaItem } from './EscovaItem';

interface MotorCardProps {
  motor: MotorComStatus;
  onDeletar: (id: number) => Promise<void>;
}

export const MotorCard: React.FC<MotorCardProps> = ({ motor, onDeletar }) => {
  const [excluindo, setExcluindo] = useState(false);
  const statusTheme = STATUS_THEME[motor.statusGeral];

  const handleDeletar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Tem certeza que deseja remover o motor "${motor.nome}"?`)) {
      setExcluindo(true);
      try {
        await onDeletar(motor.id);
      } finally {
        setExcluindo(false);
      }
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden ${
        motor.statusGeral === 'perigo'
          ? 'border-rose-300 ring-2 ring-rose-100'
          : ''
      }`}
    >
      {/* Faixa Superior Semântica Colorida */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: statusTheme.accent }}
      />

      <div className="p-5 flex-1 flex flex-col">
        {/* Cabeçalho do Card */}
        <div className="flex justify-between items-start gap-3 mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {motor.nome}
              </h3>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                #{motor.id}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{motor.tipo}</p>
          </div>

          {/* Badge de Status Geral Consolidado */}
          <div
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${statusTheme.badgeBg}`}
          >
            {motor.statusGeral === 'normal' && (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            )}
            {motor.statusGeral === 'warning' && (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            )}
            {motor.statusGeral === 'perigo' && (
              <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            )}
            {motor.statusGeral === 'offline' && (
              <Radio className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{statusTheme.label}</span>
          </div>
        </div>

        {/* Resumo de Métricas Rápidas do Motor */}
        <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100 mb-4 flex justify-between items-center text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Temp. Máx. do Motor</span>
            <span
              className="text-sm font-black font-mono"
              style={{ color: statusTheme.accent }}
            >
              {formatarTemperatura(motor.temperaturaMaxima)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-slate-500 block text-[11px]">Escovas Ativas</span>
            <span className="text-sm font-bold text-slate-800">
              {motor.sensores.length} {motor.sensores.length === 1 ? 'sensor' : 'sensores'}
            </span>
          </div>
        </div>

        {/* Lista de Escovas do Motor */}
        <div className="space-y-2 flex-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Escovas Monitoradas (ESP32)
          </p>

          {motor.sensores.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              Nenhuma escova associada a este motor.
            </p>
          ) : (
            <div className="space-y-2">
              {motor.sensores.map((sensor) => (
                <EscovaItem key={sensor.id} sensor={sensor} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rodapé do Card com Ações Limpas */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
        <span className="text-[11px]">
          {motor.totalAlertas > 0 ? (
            <strong className="text-rose-600">
              ⚠️ {motor.totalAlertas} {motor.totalAlertas === 1 ? 'escova em perigo' : 'escovas em perigo'}
            </strong>
          ) : (
            <span className="text-emerald-700 font-medium">✓ Tudo estável</span>
          )}
        </span>

        <button
          onClick={handleDeletar}
          disabled={excluindo}
          className="text-slate-400 hover:text-rose-600 transition p-1 rounded hover:bg-white flex items-center gap-1 text-[11px]"
          title="Remover motor"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Excluir</span>
        </button>
      </div>
    </div>
  );
};

