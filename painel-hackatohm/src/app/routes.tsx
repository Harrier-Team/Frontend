import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { MonitoramentoProvider } from '../hooks/MonitoramentoProvider';
import { DetalhesMotor } from '../features/motores/pages/DetalhesMotor';
import { ToastProvider } from '../components/ui/Toast';
import { VisaoGeral } from '../pages/VisaoGeral';
import { RegrasQualidade } from '../features/quality-gates/pages/RegrasQualidade';

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
            <Route path="/regras-qualidade" element={<RegrasQualidade />} />
            <Route path="*" element={<ParaVisaoGeral />} />
          </Route>
        </Routes>
      </ToastProvider>
    </MonitoramentoProvider>
  );
}
