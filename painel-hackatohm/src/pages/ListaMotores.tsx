import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MotorResponse } from '../types/motor';

export const ListaMotores: React.FC = () => {
  const [motores, setMotores] = useState<MotorResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/motores')
      .then((res) => res.json())
      .then((data) => setMotores(data))
      .catch((err) => console.error('Erro ao carregar motores:', err))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Motores Cadastrados</h1>
          <p className="text-sm text-gray-500">Selecione um motor para acessar seu painel de monitoramento.</p>
        </div>
        <Link
          to="/motores/cadastrar"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded shadow transition"
        >
          + Novo Motor
        </Link>
      </div>

      {carregando ? (
        <p className="text-gray-500 text-center py-8">Carregando lista...</p>
      ) : motores.length === 0 ? (
        <div className="bg-white p-8 rounded text-center border border-gray-200">
          <p className="text-gray-500">Nenhum motor cadastrado até o momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {motores.map((motor) => (
            <div
              key={motor.id}
              onClick={() => navigate(`/motores/${motor.id}`)}
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-400 cursor-pointer transition flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-lg font-bold text-gray-800">{motor.nome}</h2>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">
                    ID: #{motor.id}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">Tipo: {motor.tipo}</p>

                <div className="bg-gray-50 p-3 rounded border text-xs text-gray-600 space-y-1">
                  <p className="font-semibold text-gray-700">Sensores vinculados:</p>
                  {motor.sensores.map((s) => (
                    <div key={s.id} className="flex justify-between">
                      <span>Escova #{s.numeroEscova} ({s.modelo})</span>
                      <span className="font-mono text-gray-400">{s.id}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t flex justify-end">
                <span className="text-xs font-bold text-indigo-600 hover:underline">
                  Abrir Monitoramento &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};