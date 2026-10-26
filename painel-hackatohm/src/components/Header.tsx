import React from 'react';
import { Activity, Gauge, Plus, RefreshCw, Settings2, WifiOff } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
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
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[76px] flex-wrap items-center justify-between gap-4 py-3">
          {/* Logotipo e Identificação */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-[0.12em] text-slate-900">
                  HACKATOHM
                </span>
                <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:inline">
                  Operações
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500">
                Supervisão de motores e telemetria
              </p>
            </div>
          </Link>

          <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto border-t border-slate-100 pt-2 sm:order-none sm:w-auto sm:border-0 sm:pt-0" aria-label="Navegação principal">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Gauge className="h-4 w-4" aria-hidden="true" />
              Visão geral
            </NavLink>
            <NavLink
              to="/motores"
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              Motores
            </NavLink>
            <NavLink
              to="/regras-qualidade"
              className={({ isActive }) =>
                `inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Settings2 className="h-4 w-4" aria-hidden="true" />
              Quality Gates
            </NavLink>
          </nav>

          {/* Sincronização em Tempo Real e Ações */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status SignalR / WebSocket */}
            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 lg:flex">
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

              <span className="text-slate-300">·</span>
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
              title="Recarregar dados"
              aria-label="Recarregar dados"
              className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${atualizando ? 'animate-spin text-indigo-600' : ''}`}
              />
            </button>

            {/* Botão Adicionar Motor */}
            <button
              onClick={onNovoMotor}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
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
