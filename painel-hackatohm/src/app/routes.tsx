import { Route, Routes } from 'react-router-dom';
import App from '../App';
import { Layout } from '../components/Layout';
import { MonitoramentoProvider } from '../hooks/MonitoramentoProvider';
import { DetalhesMotor } from '../features/motores/pages/DetalhesMotor';
import { Home } from '../pages/Home';
import { ListaMotores } from '../features/motores/pages/ListaMotores';
import { RegrasQualidade } from '../features/quality-gates/pages/RegrasQualidade';

export function AppRoutes() {
  return (
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
  );
}
