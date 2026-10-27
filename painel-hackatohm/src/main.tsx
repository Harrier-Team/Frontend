import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { AppRoutes } from './app/routes';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Elemento raiz da aplicação não foi encontrado.');
}

async function iniciar(raiz: HTMLElement) {
  // A condição fica escrita aqui, e não numa constante importada, para o bundler
  // removê-la (junto com o import dinâmico) na compilação de produção.
  if (import.meta.env.DEV && import.meta.env.VITE_SIMULADOR === 'true') {
    const { instalarSimulador } = await import('./dev/simulador');
    instalarSimulador();
  }

  createRoot(raiz).render(
    <StrictMode>
      <AppErrorBoundary>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppErrorBoundary>
    </StrictMode>
  );
}

void iniciar(rootElement);
