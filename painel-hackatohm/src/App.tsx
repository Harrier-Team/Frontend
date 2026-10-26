import { useMemo, useState } from 'react';
import { AlertCircle, Layers, Plus, RefreshCw, WifiOff } from 'lucide-react';
import { useMonitoramento } from './hooks/useMonitoramento';
import { Header } from './components/Header';
import { KpiStatsBar } from './components/KpiStatsBar';
import { ModalCadastro } from './features/motores/components/ModalCadastro';
import { MotorCard } from './features/motores/components/MotorCard';
import { NivelStatus } from './types/telemetria';

type FiltroStatus = NivelStatus | 'todos';

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
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos');

  const motoresFiltrados = useMemo(() => {
    if (filtroStatus === 'todos') return motoresComStatus;
    return motoresComStatus.filter((motor) => motor.statusGeral === filtroStatus);
  }, [motoresComStatus, filtroStatus]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 selection:bg-indigo-100 selection:text-indigo-800">
      <Header />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {erroMotores && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 shadow-xs">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold">Falha na conexão com a API</p>
                <p className="text-xs text-rose-600">{erroMotores}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void recarregarMotores()}
              className="flex items-center space-x-1 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Tentar Novamente</span>
            </button>
          </div>
        )}

        <KpiStatsBar
          kpis={kpis}
          filtroAtivo={filtroStatus}
          onSelecionarFiltro={setFiltroStatus}
        />

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
              type="button"
              onClick={() => setFiltroStatus('todos')}
              className="text-xs font-semibold text-indigo-600 underline hover:text-indigo-800"
            >
              Limpar filtro (mostrando apenas: {filtroStatus})
            </button>
          )}
        </div>

        {carregandoMotores && motores.length === 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 animate-pulse">
                <div className="h-5 w-1/2 rounded bg-slate-200" />
                <div className="h-4 w-1/3 rounded bg-slate-100" />
                <div className="space-y-2 pt-4">
                  <div className="h-12 rounded bg-slate-100" />
                  <div className="h-12 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : motores.length === 0 ? (
          <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Layers className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mb-1 text-lg font-bold text-slate-900">
              Nenhum motor cadastrado ainda
            </h2>
            <p className="mb-6 text-xs leading-relaxed text-slate-500">
              Comece cadastrando o primeiro motor e informando o endereço MAC do ESP32 acoplado.
            </p>
            <button
              type="button"
              onClick={() => setModalCadastroAberto(true)}
              className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Cadastrar Primeiro Motor</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {motoresFiltrados.map((motor) => (
              <MotorCard key={motor.id} motor={motor} />
            ))}
          </div>
        )}
      </main>
      <ModalCadastro
        aberto={modalCadastroAberto}
        onFechar={() => setModalCadastroAberto(false)}
        onCadastrar={cadastrarMotor}
      />
    </div>
  );
}
