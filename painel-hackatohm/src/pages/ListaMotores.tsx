import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import { ModalCadastro } from '../components/ModalCadastro';
import { MotorCard } from '../components/MotorCard';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { useMonitoramento } from '../hooks/MonitoramentoContext';

export const ListaMotores: React.FC = () => {
  const {
    motores,
    motoresComStatus,
    carregando,
    erro,
    recarregar,
    cadastrarMotor,
  } = useMonitoramento();
  const [searchParams, setSearchParams] = useSearchParams();
  const modalCadastroAberto = searchParams.get('novo') === 'true';

  const abrirCadastro = () => setSearchParams({ novo: 'true' });

  const fecharCadastro = () => setSearchParams({}, { replace: true });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
            Ativos monitorados
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            Motores
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Consulte o estado operacional e a telemetria dos motores cadastrados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void recarregar()}
            disabled={carregando}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            type="button"
            onClick={abrirCadastro}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo motor
          </button>
        </div>
      </div>

      {erro && (
        <Alert
          title="Não foi possível carregar os motores"
          message={erro}
          tone="error"
        />
      )}

      {carregando && motores.length === 0 ? (
        <LoadingState label="Carregando motores..." />
      ) : motores.length === 0 ? (
        <EmptyState
          title="Nenhum motor cadastrado"
          description="Cadastre um motor e informe o endereço MAC do ESP32 acoplado para iniciar o monitoramento."
          action={
            <button
              type="button"
              onClick={abrirCadastro}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Cadastrar primeiro motor
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {motoresComStatus.map((motor) => (
            <MotorCard key={motor.id} motor={motor} />
          ))}
        </div>
      )}

      <ModalCadastro
        aberto={modalCadastroAberto}
        onFechar={fecharCadastro}
        onCadastrar={cadastrarMotor}
      />
    </div>
  );
};
