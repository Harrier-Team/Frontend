import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export const Layout: React.FC = () => (
  <div className="flex min-h-screen flex-col">
    <a href="#conteudo" className="skip-link">
      Pular para o conteúdo
    </a>
    <Header />
    <main
      id="conteudo"
      tabIndex={-1}
      className="mx-auto w-full max-w-[1280px] flex-1 px-5 pb-24 pt-10 outline-none sm:px-8 sm:pt-14"
    >
      <Outlet />
    </main>
  </div>
);
