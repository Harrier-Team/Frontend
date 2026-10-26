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

createRoot(rootElement).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>
);
