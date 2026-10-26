import React from 'react';
import { Activity, Gauge, Settings2 } from 'lucide-react';
import { NavLink, Outlet, Link } from 'react-router-dom';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-[0.12em] text-slate-900">HACKATOHM</span>
              <span className="block text-[10px] font-medium text-slate-500">Operações</span>
            </div>
          </Link>

          <nav className="flex items-center gap-1" aria-label="Navegação principal">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              <Gauge className="h-4 w-4" aria-hidden="true" />
              Visão geral
            </NavLink>
            <NavLink
              to="/motores"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              Motores
            </NavLink>
            <NavLink
              to="/regras-qualidade"
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              <Settings2 className="h-4 w-4" aria-hidden="true" />
              Quality Gates
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Conteúdo Dinâmico das Páginas */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};