import React from 'react';
import { Activity, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import harrierIdentity from '@/assets/harrier-identity.jpg';
import { useMonitoramento } from '@/hooks/useMonitoramento';

const linkBase = 'flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-[13px] transition-colors';

const ConexaoAoVivo: React.FC = () => {
  const { statusConexaoHub } = useMonitoramento();
  const aoVivo = statusConexaoHub === 'conectado';
  const texto = {
    conectado: 'Ao vivo', conectando: 'Conectando',
    reconectando: 'Reconectando', desconectado: 'Sem conexão',
  }[statusConexaoHub];
  return (
    <div className={`status-pill ${aoVivo ? 'text-ok' : 'text-warn'}`} role="status">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {texto}
    </div>
  );
};

export const Header: React.FC = () => {
  const { pathname } = useLocation();
  const emMotores = pathname === '/' || pathname.startsWith('/motores');
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-x-3 px-5 sm:gap-x-6 sm:px-8 lg:flex-nowrap">
        <Link to="/" className="flex h-20 items-center gap-2" aria-label="Harrier, início">
          <span className="brand-emblem"><img src={harrierIdentity} alt="" /></span>
          <span>
            <span className="block text-[12px] font-medium uppercase text-ink sm:text-[14px]" style={{ fontStretch: '125%', letterSpacing: '0.28em' }}>Harrier</span>
            <span className="mt-0.5 hidden text-[9px] uppercase tracking-[0.2em] text-ink-3 sm:block">Monitoramento térmico</span>
          </span>
        </Link>
        <nav aria-label="Principal" className="order-3 flex w-full gap-1 border-t border-line py-2 lg:order-none lg:w-auto lg:border-0 lg:py-0">
          <Link to="/" aria-current={emMotores ? 'page' : undefined}
            className={`${linkBase} flex-1 lg:flex-none ${emMotores ? 'bg-raised text-ink' : 'text-ink-2 hover:bg-panel hover:text-ink'}`}>
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Visão geral
          </Link>
          <NavLink to="/regras-qualidade" className={({ isActive }) => `${linkBase} flex-1 lg:flex-none ${isActive ? 'bg-raised text-ink' : 'text-ink-2 hover:bg-panel hover:text-ink'}`}>
            <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Regras de qualidade
          </NavLink>
        </nav>
        <div className="flex items-center gap-4">
          <span className="hidden items-center gap-1.5 text-[11px] text-ink-3 xl:flex"><Activity className="h-3.5 w-3.5" aria-hidden="true" /> Telemetria</span>
          <ConexaoAoVivo />
        </div>
      </div>
    </header>
  );
};
