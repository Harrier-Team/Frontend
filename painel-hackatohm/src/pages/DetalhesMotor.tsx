import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MotorResponse } from '../types/motor';
import { motorService } from '../services/motorService';
import { MotorQualityRulesSection } from '../components/motores/MotorQualityRulesSection';

export const DetalhesMotor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [motor, setMotor] = useState<MotorResponse | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!id) return;
    motorService.obterPorId(Number(id))
      .then((data) => setMotor(data))
      .catch((err) => console.error(err))
      .finally(() => setCarregando(false));
  }, [id]);

  if (carregando) return <p className="text-center py-8">Carregando detalhes do motor...</p>;
  if (!motor) return <p className="text-center py-8 text-red-500">Motor não encontrado.</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link to="/motores" className="text-sm text-indigo-600 font-semibold hover:underline">
          &larr; Voltar para a Lista de Motores
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex justify-between items-start border-b pb-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{motor.nome}</h1>
            <p className="text-sm text-gray-500">Categoria: {motor.tipo}</p>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
            ● Ativo
          </span>
        </div>

        {/* Painel de Escovas / Sensores ESP32 */}
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Escovas Monitoradas (ESP32)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {motor.sensores.map((sensor) => (
            <div key={sensor.id} className="p-4 border rounded bg-slate-50 space-y-2">
              <div className="flex justify-between">
                <span className="font-bold text-slate-700">Escova #{sensor.numeroEscova}</span>
                <span className="text-xs bg-slate-200 px-2 py-0.5 rounded font-mono">{sensor.modelo}</span>
              </div>
              <p className="text-xs text-slate-500 font-mono">ID / MAC: {sensor.id}</p>
              
              {/* Espaço reservado para gráficos ou medições em tempo real */}
              <div className="mt-2 p-3 bg-white rounded border text-center text-xs text-gray-400">
                Aguardando telemetria em tempo real do ESP32...
              </div>
            </div>
          ))}
        </div>
      </div>

      <MotorQualityRulesSection motorId={motor.id} />
    </div>
  );
};