import React from 'react';
import { Activity, Plus, RefreshCw, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatarHora } from '../utils/statusHelper';
import { StatusConexaoHub } from '../services/signalrService';

interface HeaderProps {
  ultimaAtualizacao: Date | null;
  atualizando: boolean;
  statusConexaoHub: StatusConexaoHub;
  onAtualizar: () => void;
  onNovoMotor: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  ultimaAtualizacao,
  atualizando,
  statusConexaoHub,
  onAtualizar,
  onNovoMotor,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logotipo e Identificação */}
          <div className="flex items-center space-x-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  HACKATOHM
                </span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold border border-slate-200">
                  Monitoramento IoT
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Supervisão de Motores e Telemetria em Tempo Real (SignalR)
              </p>
            </div>
          </div>

          {/* Sincronização em Tempo Real e Ações */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Status SignalR / WebSocket */}
            <div className="hidden sm:flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600">
              {statusConexaoHub === 'conectado' && (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="font-semibold text-emerald-700">Ao Vivo</span>
                </>
              )}

              {statusConexaoHub === 'conectando' && (
                <>
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <span className="font-semibold text-amber-700">Conectando...</span>
                </>
              )}

              {statusConexaoHub === 'reconectando' && (
                <>
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping"></span>
                  <span className="font-semibold text-amber-800">Reconectando...</span>
                </>
              )}

              {statusConexaoHub === 'desconectado' && (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-500">Desconectado</span>
                </>
              )}

              <span className="text-slate-300">|</span>
              <span>
                Último evento:{' '}
                <strong className="font-mono text-slate-700">
                  {formatarHora(ultimaAtualizacao?.toISOString())}
                </strong>
              </span>
            </div>

            {/* Botão de Forçar Atualização */}
            <button
              onClick={onAtualizar}
              disabled={atualizando}
              title="Recarregar snapshot agora"
              className="p-2.5 text-slate-600 bg-white hover:bg-slate-50 hover:text-indigo-600 active:scale-95 border border-slate-200 rounded-lg transition shadow-xs disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${atualizando ? 'animate-spin text-indigo-600' : ''}`}
              />
            </button>

            {/* Botão Adicionar Motor */}
            <Link
              to="/regras-qualidade"
              className="hidden sm:inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Regras
            </Link>
            <button
              onClick={onNovoMotor}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Motor</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
