import React, { lazy, Suspense } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import { Header } from './Header';
import { LoadingState } from './ui/LoadingState';
import { MonitorOperacional } from '@/features/eventos/components/MonitorOperacional';

const ModoApresentacao = lazy(() =>
  import('@/pages/ModoApresentacao').then((m) => ({ default: m.ModoApresentacao }))
);

export const Layout: React.FC = () => {
  const [params] = useSearchParams();
  const apresentacao = params.get('modo') === 'tv';

  return (
    <>
      <MonitorOperacional />
      {apresentacao ? (
        <Suspense fallback={<LoadingState label="Carregando modo apresentação" />}>
          <ModoApresentacao />
        </Suspense>
      ) : (
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
            <Suspense fallback={<LoadingState label="Carregando página" />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      )}
    </>
  );
};
