import React, { useState, useMemo } from 'react';
import { useMonitoramento } from './hooks/MonitoramentoContext';
import { Header } from './components/Header';
import { KpiStatsBar } from './components/KpiStatsBar';
import { MotorCard } from './components/MotorCard';
import { ModalCadastro } from './components/ModalCadastro';
import { Plus, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { WifiOff } from 'lucide-react';

export default function App() {
  const {
    motores,
    carregando: carregandoMotores,
    erro: erroMotores,
    recarregar: recarregarMotores,
    cadastrarMotor,
    motoresComStatus,
    kpis,
    statusConexaoHub,
  } = useMonitoramento();

  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // Filtragem opcional pelos KPI cards
  const motoresFiltrados = useMemo(() => {
    if (filtroStatus === 'todos') return motoresComStatus;
    return motoresComStatus.filter((m) => m.statusGeral === filtroStatus);
  }, [motoresComStatus, filtroStatus]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 selection:bg-indigo-100 selection:text-indigo-800">
      {/* Header com Status do WebSocket SignalR */}
      <Header />

      {/* Conteúdo Principal do Dashboard */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Banner de Erro de Conexão com a API */}
        {erroMotores && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">Falha na conexão com a API</p>
                <p className="text-xs text-rose-600">{erroMotores}</p>
              </div>
            </div>
            <button
              onClick={recarregarMotores}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-rose-300 text-rose-700 rounded-lg hover:bg-rose-50 flex items-center space-x-1 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tentar Novamente</span>
            </button>
          </div>
        )}

        {/* Barra de Métricas Globais (KPIs com filtro rápido) */}
        <KpiStatsBar
          kpis={kpis}
          filtroAtivo={filtroStatus}
          onSelecionarFiltro={setFiltroStatus}
        />

        {/* Título da Seção e Filtro Ativo */}
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
              Visão geral
            </p>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                Motores em monitoramento
              </h1>
              <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                {motoresFiltrados.length}
              </span>
            </div>
            {statusConexaoHub !== 'conectado' && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800">
                <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
                {statusConexaoHub === 'reconectando'
                  ? 'Telemetria reconectando'
                  : statusConexaoHub === 'conectando'
                    ? 'Conectando à telemetria'
                    : 'Telemetria desconectada'}
              </div>
            )}
          </div>

          {filtroStatus !== 'todos' && (
            <button
              onClick={() => setFiltroStatus('todos')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline"
            >
              Limpar filtro (mostrando apenas: {filtroStatus})
            </button>
          )}
        </div>

        {/* Estado de Carregamento Inicial */}
        {carregandoMotores && motores.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse space-y-4"
              >
                <div className="h-5 bg-slate-200 rounded w-1/2"></div>
                <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                <div className="space-y-2 pt-4">
                  <div className="h-12 bg-slate-100 rounded"></div>
                  <div className="h-12 bg-slate-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : motores.length === 0 ? (
          /* Estado Vazio (Sem Motores) */
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs max-w-lg mx-auto mt-6">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Layers className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Nenhum motor cadastrado ainda
            </h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Comece cadastrando o primeiro motor e informando o endereço MAC do
              ESP32 acoplado.
            </p>
            <button
              onClick={() => setModalCadastroAberto(true)}
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeiro Motor</span>
            </button>
          </div>
        ) : (
          /* Grid de Motores em Monitoramento */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {motoresFiltrados.map((motor) => (
              <MotorCard
                key={motor.id}
                motor={motor}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal de Cadastro */}
      <ModalCadastro
        aberto={modalCadastroAberto}
        onFechar={() => setModalCadastroAberto(false)}
        onCadastrar={cadastrarMotor}
      />
    </div>
  );
}
