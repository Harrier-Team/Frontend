import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export const Layout: React.FC = () => (
  <div className="flex min-h-screen flex-col">
    <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
    <Header />
    <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-[1280px] flex-1 px-5 pb-12 pt-8 sm:px-8 sm:pt-10">
      <Outlet />
    </main>
    <footer className="mx-auto flex w-full max-w-[1280px] flex-wrap justify-between gap-2 px-5 pb-6 text-[11px] text-ink-3 sm:px-8">
      <span>HARRIER <span className="mx-2 text-line-strong">/</span> Escovas e anéis coletores</span>
      <span>Projeto Hackatohm · 2026</span>
    </footer>
  </div>
);
