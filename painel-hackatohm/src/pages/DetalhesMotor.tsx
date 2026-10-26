import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Cpu, Trash2 } from 'lucide-react';
import { MotorResponse } from '../types/motor';
import { motorService } from '../services/motorService';
import { MotorQualityRulesSection } from '../components/motores/MotorQualityRulesSection';
import { EscovaItem } from '../components/EscovaItem';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Alert } from '../components/ui/Alert';
import { useMonitoramento } from '../hooks/MonitoramentoContext';

export const DetalhesMotor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deletarMotor, motoresComStatus } = useMonitoramento();
  const [motor, setMotor] = useState<MotorResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroOperacao, setErroOperacao] = useState<string | null>(null);
  const motorMonitorado = motor
    ? motoresComStatus.find((item) => item.id === motor.id)
    : undefined;

  useEffect(() => {
    if (!id) return;
    motorService.obterPorId(Number(id))
      .then((data) => setMotor(data))
      .catch((err) => console.error(err))
      .finally(() => setCarregando(false));
  }, [id]);

  const handleExcluir = async () => {
    if (!motor) return;
    setExcluindo(true);
    try {
      await deletarMotor(motor.id);
      navigate('/motores');
    } catch (error) {
      setErroOperacao(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir o motor.'
      );
    } finally {
      setExcluindo(false);
    }
  };

  if (carregando) return <p className="text-center py-8">Carregando detalhes do motor...</p>;
  if (!motor) return <p className="text-center py-8 text-red-500">Motor não encontrado.</p>;

  return (
    <div className="space-y-6">
      {erroOperacao && (
        <Alert
          title="Não foi possível concluir a operação"
          message={erroOperacao}
          tone="error"
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/motores" className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar para motores
        </Link>
        <button
          type="button"
          onClick={() => setConfirmandoExclusao(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Excluir motor
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-950 px-6 py-7 text-white">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <Cpu className="h-6 w-6 text-indigo-200" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">
                Motor em monitoramento
              </p>
              <h1 className="mt-1 text-2xl font-bold">{motor.nome}</h1>
              <p className="mt-1 text-sm text-slate-300">{motor.tipo}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Escovas monitoradas</h2>
              <p className="mt-1 text-sm text-slate-500">
                Sensores ESP32 instalados neste motor.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {motor.sensores.length} {motor.sensores.length === 1 ? 'sensor' : 'sensores'}
            </span>
          </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {motor.sensores.map((sensor) => (
            <EscovaItem
              key={sensor.id}
              sensor={
                motorMonitorado?.sensores.find((item) => item.id === sensor.id) ?? {
                  ...sensor,
                  status: 'offline',
                }
              }
            />
          ))}
        </div>
        </div>
      </div>

      <MotorQualityRulesSection motorId={motor.id} />
      <ConfirmDialog
        open={confirmandoExclusao}
        title={`Excluir "${motor.nome}"?`}
        description="Esta operação removerá o motor e seus vínculos. Ela não poderá ser desfeita."
        confirmLabel="Excluir motor"
        busy={excluindo}
        onCancel={() => setConfirmandoExclusao(false)}
        onConfirm={handleExcluir}
      />
    </div>
  );
};