import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import harrierMark from '../assets/harrier-mark.png';
import { useConexaoHub } from '@/features/telemetria/hooks/useTelemetriaStore';

const linkBase =
  'relative flex h-14 items-center px-1 text-sm transition-colors after:absolute after:inset-x-1 after:bottom-0 after:h-px after:transition-colors';

const ConexaoAoVivo: React.FC = () => {
  const statusConexaoHub = useConexaoHub();
  const ao_vivo = statusConexaoHub === 'conectado';
  const texto = {
    conectado: 'Hub conectado',
    conectando: 'Conectando',
    reconectando: 'Reconectando',
    desconectado: 'Sem conexão',
  }[statusConexaoHub];

  return (
    <div className="flex items-center gap-2 text-[13px] text-ink-2" role="status">
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full"
        style={{
          background: ao_vivo ? 'var(--color-flare)' : 'var(--color-warn)',
          boxShadow: ao_vivo ? '0 0 10px rgb(241 237 228 / 0.7)' : undefined,
          animation: ao_vivo ? undefined : 'flare-breathe 1.6s ease-in-out infinite',
        }}
      />
      <span className={ao_vivo ? '' : 'text-warn'}>{texto}</span>
    </div>
  );
};

export const Header: React.FC = () => {
  const { pathname } = useLocation();
  const emMotores = pathname === '/' || pathname.startsWith('/motores');

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1120px] items-center gap-8 px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-3" aria-label="Harrier, início">
          <img src={harrierMark} alt="" className="h-8 w-auto" />
          <span
            className="hidden text-[13px] font-medium uppercase text-ink sm:inline"
            style={{ fontStretch: '125%', letterSpacing: '0.34em' }}
          >
            Harrier
          </span>
        </Link>

        <nav aria-label="Principal" className="flex items-center gap-5">
          <Link
            to="/"
            aria-current={emMotores ? 'page' : undefined}
            className={`${linkBase} ${
              emMotores ? 'text-ink after:bg-flare' : 'text-ink-2 after:bg-transparent hover:text-ink'
            }`}
          >
            Motores
          </Link>
          <NavLink
            to="/regras-qualidade"
            className={({ isActive }) =>
              `${linkBase} ${
                isActive ? 'text-ink after:bg-flare' : 'text-ink-2 after:bg-transparent hover:text-ink'
              }`
            }
          >
            Quality gates
          </NavLink>
        </nav>

        <div className="ml-auto">
          <ConexaoAoVivo />
        </div>
      </div>
    </header>
  );
};
