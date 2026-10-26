import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Header / Top Menu */}
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-black text-indigo-400">HACKATOHM</span>
            <span className="text-xs bg-indigo-900 text-indigo-200 px-2 py-0.5 rounded font-mono">v1.0</span>
          </div>

          {/* Menu de Abas */}
          <nav className="flex space-x-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-4 py-2 rounded-md text-sm font-medium transition ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-slate-800'
                }`
              }
            >
              Início
            </NavLink>

            <NavLink
              to="/motores"
              className={({ isActive }) =>
                `px-4 py-2 rounded-md text-sm font-medium transition ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-slate-800'
                }`
              }
            >
              Motores
            </NavLink>

            <NavLink
              to="/regras-qualidade"
              className={({ isActive }) =>
                `px-4 py-2 rounded-md text-sm font-medium transition ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-slate-800'
                }`
              }
            >
              Regras de qualidade
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Conteúdo Dinâmico das Páginas */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};