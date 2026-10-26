import React from 'react';
import { Wifi, WifiOff, AlertOctagon } from 'lucide-react';
import { SensorComTelemetria } from '../../../types/telemetria';
import {
  STATUS_THEME,
  formatarTemperatura,
  formatarHora,
} from '../../../utils/statusHelper';
import { QualityGateResultList } from '../../../components/quality-gates/QualityGateResultList';

interface EscovaItemProps {
  sensor: SensorComTelemetria;
}

export const EscovaItem: React.FC<EscovaItemProps> = ({ sensor }) => {
  const statusTheme = STATUS_THEME[sensor.status];
  const temperatura = sensor.ultimaLeitura?.valorCelsius ?? null;
  const isPerigo = sensor.status === 'perigo';
  const isOnline = Boolean(sensor.ipAtual);

  // Calcula porcentagem para a barra térmica (0 a 100°C)
  const percentualBarra = Math.min(Math.max(temperatura || 0, 0), 100);

  return (
    <div
      className={`p-3.5 rounded-lg border transition ${
        isPerigo
          ? 'bg-rose-50/60 border-rose-300'
          : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-slate-800">
              Escova #{sensor.numeroEscova}
            </span>
            <span className="text-[10px] bg-white text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
              {sensor.modelo}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-mono mt-0.5">
            {isOnline ? (
              <span className="flex items-center text-emerald-600 gap-1" title="ESP32 conectado">
                <Wifi className="w-3 h-3" />
                <span>{sensor.ipAtual}</span>
              </span>
            ) : (
              <span className="flex items-center text-slate-400 gap-1" title="Sem IP reportado">
                <WifiOff className="w-3 h-3" />
                <span>Offline</span>
              </span>
            )}
          </div>
        </div>

        {/* Temperatura Atual em destaque */}
        <div className="text-right">
          <span
            className="text-lg font-black font-mono tracking-tight"
            style={{ color: statusTheme.accent }}
          >
            {formatarTemperatura(temperatura)}
          </span>
          <p className="text-[10px] text-slate-400">
            {sensor.ultimaLeitura?.dataHora
              ? formatarHora(sensor.ultimaLeitura.dataHora)
              : 'Sem leitura'}
          </p>
        </div>
      </div>

      {/* Barra de progresso térmico */}
      <div className="mt-2">
        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: `${percentualBarra}%`,
              backgroundColor: statusTheme.accent,
            }}
          />
        </div>
      </div>

      {/* Alerta de Desgaste Térmico Crítico */}
      {isPerigo && (
        <div className="mt-2.5 flex items-center space-x-1.5 p-1.5 bg-rose-100/80 text-rose-800 text-[11px] font-semibold rounded border border-rose-200">
          <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>Alerta: Limiar crítico (≥ 80°C) violado!</span>
        </div>
      )}

      {sensor.ultimaLeitura && (
        <QualityGateResultList
          resultados={sensor.ultimaLeitura.resultadosQualityGates}
        />
      )}
    </div>
  );
};
