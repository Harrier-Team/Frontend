import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from './App.jsx'
import { Layout } from './components/Layout'
import { DetalhesMotor } from './pages/DetalhesMotor'
import { Home } from './pages/Home'
import { ListaMotores } from './pages/ListaMotores'
import { RegrasQualidade } from './pages/RegrasQualidade'
import { MonitoramentoProvider } from './hooks/MonitoramentoContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
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
  </StrictMode>,
)
