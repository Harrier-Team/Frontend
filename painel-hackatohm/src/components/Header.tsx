import React from 'react';
import { Gauge, Settings2 } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import harrierLogo from '../assets/HarrierTeamLogo.jpeg';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[76px] flex-wrap items-center justify-between gap-4 py-3">
          {/* Logotipo e Identificação */}
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-sm">
              <img
                src={harrierLogo}
                alt="Harrier Team"
                className="h-full w-full object-cover object-center"
              />
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

          <div className="order-3 flex w-full items-center justify-end gap-3 border-t border-slate-100 pt-2 sm:order-none sm:w-auto sm:border-0 sm:pt-0">
          <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Navegação principal">
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
          </div>
        </div>
      </div>
    </header>
  );
};
