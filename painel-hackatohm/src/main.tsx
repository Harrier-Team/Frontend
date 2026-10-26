import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './index.css';
import App from './App';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { Layout } from './components/Layout';
import { MonitoramentoProvider } from './hooks/MonitoramentoContext';
import { DetalhesMotor } from './pages/DetalhesMotor';
import { Home } from './pages/Home';
import { ListaMotores } from './pages/ListaMotores';
import { RegrasQualidade } from './pages/RegrasQualidade';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Elemento raiz da aplicação não foi encontrado.');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <MonitoramentoProvider>
          <Routes>
            <Route path="/" element={<App />} />
            <Route element={<Layout />}>
              <Route path="/inicio" element={<Home />} />
              <Route path="/motores" element={<ListaMotores />} />
              <Route path="/motores/:id" element={<DetalhesMotor />} />
              <Route path="/regras-qualidade" element={<RegrasQualidade />} />
            </Route>
          </Routes>
        </MonitoramentoProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>
);
