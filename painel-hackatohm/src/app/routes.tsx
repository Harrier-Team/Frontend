import { lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { MonitoramentoProvider } from '../hooks/MonitoramentoProvider';
import { ToastProvider } from '../components/ui/Toast';

// Cada tela vira um pedaço próprio do pacote, carregado quando a rota abre.
// Os componentes são exportados nomeados, por isso o `.then` escolhe o export.
const VisaoGeral = lazy(() => import('../pages/VisaoGeral').then((m) => ({ default: m.VisaoGeral })));
const DetalhesMotor = lazy(() =>
  import('../features/motores/pages/DetalhesMotor').then((m) => ({ default: m.DetalhesMotor }))
);
const RegrasQualidade = lazy(() =>
  import('../features/quality-gates/pages/RegrasQualidade').then((m) => ({ default: m.RegrasQualidade }))
);
const Eventos = lazy(() => import('../features/eventos/pages/Eventos').then((m) => ({ default: m.Eventos })));
const Sistema = lazy(() => import('../features/sistema/pages/Sistema').then((m) => ({ default: m.Sistema })));

/** Rotas antigas apontam para a visão geral, preservando ?novo=true. */
function ParaVisaoGeral() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: '/', search }} replace />;
}

export function AppRoutes() {
  return (
    <MonitoramentoProvider>
      <ToastProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<VisaoGeral />} />
            <Route path="/motores" element={<ParaVisaoGeral />} />
            <Route path="/inicio" element={<ParaVisaoGeral />} />
            <Route path="/motores/:id/:aba?" element={<DetalhesMotor />} />
            <Route path="/eventos" element={<Eventos />} />
            <Route path="/regras-qualidade" element={<RegrasQualidade />} />
            <Route path="/sistema" element={<Sistema />} />
            <Route path="*" element={<ParaVisaoGeral />} />
          </Route>
        </Routes>
      </ToastProvider>
    </MonitoramentoProvider>
  );
}
