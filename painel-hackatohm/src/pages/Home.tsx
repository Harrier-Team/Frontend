import React from 'react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-lg shadow border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Painel de Controle IoT</h1>
        <p className="text-gray-600">
          Bem-vindo ao sistema Hackatohm. Selecione uma opção abaixo ou utilize a aba de motores para gerenciar o monitoramento das escovas em tempo real.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/motores"
            className="p-6 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition block text-left"
          >
            <h2 className="text-xl font-bold text-indigo-900 mb-1"> Ver Motores</h2>
            <p className="text-sm text-indigo-700">Acesse a lista de motores, selecione um para visualizar a telemetria ou cadastre um novo ESP32.</p>
          </Link>

          <Link
            to="/motores?novo=true"
            className="p-6 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition block text-left"
          >
            <h2 className="text-xl font-bold text-slate-800 mb-1">➕ Cadastrar Motor</h2>
            <p className="text-sm text-slate-600">Vincule novos motores e defina os MAC Addresses dos sensores ESP32.</p>
          </Link>
        </div>
      </div>
    </div>
  );
};