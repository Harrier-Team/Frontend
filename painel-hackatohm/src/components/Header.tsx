import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import harrierEmblem from '../assets/harrier-emblem.jpg';
import { useConexaoHub } from '@/features/telemetria/hooks/useTelemetriaStore';
import { SIMULADOR_ATIVO } from '@/dev/simuladorAtivo';
import { useCriticosNaoReconhecidos } from '@/features/alertas/hooks/useAlertas';
import { useTema } from '@/features/tema/useTema';
import { rotuloDaTroca } from '@/features/tema/temaHelper';
import { IconButton } from './ui/Button';

const linkBase =
  'relative flex h-14 items-center whitespace-nowrap px-0.5 text-[13px] sm:px-1 sm:text-sm focus-visible:outline-offset-[-2px] transition-colors after:absolute after:inset-x-1 after:bottom-0 after:h-px after:transition-colors';

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
    className="hidden rounded-full border border-line-strong px-2.5 py-0.5 text-xs text-ink-2 sm:inline-block"
    title="Os dados desta tela são fictícios (VITE_SIMULADOR=true)"
  >
    Simulação
  </span>
);

const TrocaDeTema: React.FC = () => {
  const { tema, alternar } = useTema();
  const Icone = tema === 'dark' ? Sun : Moon;
  return (
    <IconButton label={rotuloDaTroca(tema)} onClick={alternar}>
      <Icone className="h-4 w-4" aria-hidden="true" />
    </IconButton>
  );
};

/** Contador de críticos em aberto não reconhecidos: o número e o texto para leitor de tela, além da cor. */
const ContadorCriticos: React.FC = () => {
  const n = useCriticosNaoReconhecidos();
  if (n === 0) return null;
  return (
    <span
      className="num ml-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-medium leading-[18px]"
      style={{ background: 'var(--color-sev-critico)', color: 'var(--color-canvas)' }}
    >
      {n}
      <span className="sr-only">{n === 1 ? ' crítico em aberto não reconhecido' : ' críticos em aberto não reconhecidos'}</span>
    </span>
  );
};

const classeLink = (ativo: boolean) =>
  `${linkBase} ${ativo ? 'text-ink after:bg-flare' : 'text-ink-2 after:bg-transparent hover:text-ink'}`;

export const Header: React.FC = () => {
  const { pathname } = useLocation();
  const emMotores = pathname === '/' || pathname.startsWith('/motores');

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center gap-3 px-5 sm:gap-8 sm:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="Harrier, início">
          {/* Recorte da logo em alta resolução; `screen` apaga o fundo escuro e deixa só o aço e a luz. */}
          <img
            src={harrierEmblem}
            alt=""
            width={46}
            height={33}
            className="harrier-emblema h-[23px] w-[32px] object-contain sm:h-[33px] sm:w-[46px]"
          />
          <span
            className="hidden text-[13px] font-medium uppercase text-ink sm:inline"
            style={{ fontStretch: '125%', letterSpacing: '0.34em' }}
          >
            Harrier
          </span>
        </Link>

        <nav aria-label="Principal" className="flex min-w-0 items-center gap-2 overflow-x-auto sm:gap-5 [scrollbar-width:none]">
          <Link
            to="/"
            aria-current={emMotores ? 'page' : undefined}
            className={classeLink(emMotores)}
          >
            Motores
          </Link>
          <NavLink to="/eventos" className={({ isActive }) => classeLink(isActive)}>
            Eventos
            <ContadorCriticos />
          </NavLink>
          <NavLink to="/regras-qualidade" className={({ isActive }) => classeLink(isActive)}>
            <span className="sm:hidden">Regras</span>
            <span className="hidden sm:inline">Quality gates</span>
          </NavLink>
          <NavLink to="/sistema" className={({ isActive }) => classeLink(isActive)}>
            Sistema
          </NavLink>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
          {SIMULADOR_ATIVO && <BadgeSimulacao />}
          <ConexaoAoVivo />
          <TrocaDeTema />
        </div>
      </div>
      <FaixaHubDesconectado />
    </header>
  );
};
