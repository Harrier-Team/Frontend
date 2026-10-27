import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import harrierEmblem from '../assets/harrier-emblem.jpg';
import { useConexaoHub } from '@/features/telemetria/hooks/useTelemetriaStore';
import { SIMULADOR_ATIVO } from '@/dev/simuladorAtivo';

const linkBase =
  'relative flex h-14 items-center whitespace-nowrap px-1 text-sm transition-colors after:absolute after:inset-x-1 after:bottom-0 after:h-px after:transition-colors';

const ConexaoAoVivo: React.FC = () => {
  const statusConexaoHub = useConexaoHub();
  const conectado = statusConexaoHub === 'conectado';
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
          background: conectado ? 'var(--color-flare)' : 'var(--color-sev-atencao)',
          boxShadow: conectado ? '0 0 10px color-mix(in srgb, var(--color-flare) 70%, transparent)' : undefined,
          animation: conectado ? undefined : 'flare-breathe 1.6s ease-in-out infinite',
        }}
      />
      <span className={`hidden sm:inline ${conectado ? '' : 'text-sev-atencao'}`}>{texto}</span>
      <span className="sr-only sm:hidden">{texto}</span>
    </div>
  );
};

/** Faixa fina logo abaixo do cabeçalho; não empurra o conteúdo. */
const FaixaHubDesconectado: React.FC = () => {
  const conexao = useConexaoHub();
  if (conexao === 'conectado' || conexao === 'conectando') return null;
  return (
    <div
      role="status"
      className="absolute inset-x-0 top-full border-b px-5 py-1 text-center text-xs text-sev-atencao sm:px-8"
      style={{
        borderColor: 'color-mix(in srgb, var(--color-sev-atencao) 35%, var(--color-line))',
        background: 'color-mix(in srgb, var(--color-sev-atencao) 10%, var(--color-canvas))',
      }}
    >
      {conexao === 'reconectando'
        ? 'Reconectando… os valores abaixo podem estar desatualizados.'
        : 'Sem conexão com o servidor. Os valores abaixo podem estar desatualizados.'}
    </div>
  );
};

const BadgeSimulacao: React.FC = () => (
  <span
    className="rounded-full border border-line-strong px-2.5 py-0.5 text-xs text-ink-2 max-sm:px-2"
    title="Os dados desta tela são fictícios (VITE_SIMULADOR=true)"
  >
    Simulação
  </span>
);

export const Header: React.FC = () => {
  const { pathname } = useLocation();
  const emMotores = pathname === '/' || pathname.startsWith('/motores');

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center gap-5 px-5 sm:gap-8 sm:px-8">
        <Link to="/" className="flex items-center gap-3" aria-label="Harrier, início">
          {/* Recorte da logo em alta resolução; `screen` apaga o fundo escuro e deixa só o aço e a luz. */}
          <img
            src={harrierEmblem}
            alt=""
            width={46}
            height={33}
            className="h-[33px] w-[46px] object-contain"
            style={{ mixBlendMode: 'screen' }}
          />
          <span
            className="hidden text-[13px] font-medium uppercase text-ink sm:inline"
            style={{ fontStretch: '125%', letterSpacing: '0.34em' }}
          >
            Harrier
          </span>
        </Link>

        <nav aria-label="Principal" className="flex items-center gap-4 sm:gap-5">
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

        <div className="ml-auto flex items-center gap-4">
          {SIMULADOR_ATIVO && <BadgeSimulacao />}
          <ConexaoAoVivo />
        </div>
      </div>
      <FaixaHubDesconectado />
    </header>
  );
};
