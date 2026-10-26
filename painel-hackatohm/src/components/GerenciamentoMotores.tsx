import React, { useState, useEffect } from 'react';
import { MotorResponse, MotorInput, SensorInput } from '../types/motor';

const API_BASE_URL = '/api/motores';

export const GerenciamentoMotores: React.FC = () => {
  const [motores, setMotores] = useState<MotorResponse[]>([]);
  const [carregando, setCarregando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  // Estados do Formulário
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('');
  const [sensores, setSensores] = useState<SensorInput[]>([
    { macAddress: '', numeroEscova: 1, modelo: '' }
  ]);

  // Carregar motores ao montar o componente
  useEffect(() => {
    carregarMotores();
  }, []);

  async function carregarMotores(): Promise<void> {
    setCarregando(true);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error('Falha ao carregar motores');
      const data: MotorResponse[] = await response.json();
      setMotores(data);
    } catch (err: any) {
      setErro(err.message || 'Erro ao conectar com a API');
    } finally {
      setCarregando(false);
    }
  }

  // Manipulação dos campos de sensores dinâmicos
  const handleSensorChange = (index: number, field: keyof SensorInput, value: any) => {
    const novosSensores = [...sensores];
    novosSensores[index] = { ...novosSensores[index], [field]: value };
    setSensores(novosSensores);
  };

  const adicionarSensorCampo = () => {
    setSensores([...sensores, { macAddress: '', numeroEscova: sensores.length + 1, modelo: '' }]);
  };

  const removerSensorCampo = (index: number) => {
    if (sensores.length === 1) return;
    setSensores(sensores.filter((_, i) => i !== index));
  };

  // Envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const payload: MotorInput = {
      nome,
      tipo,
      sensoresIniciais: sensores
    };

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const mensagemErro = await response.text();
        throw new Error(mensagemErro || 'Erro ao cadastrar motor');
      }

      // Limpa formulário e recarrega lista
      setNome('');
      setTipo('');
      setSensores([{ macAddress: '', numeroEscova: 1, modelo: '' }]);
      carregarMotores();
    } catch (err: any) {
      setErro(err.message);
    }
  };

  const handleDeletar = async (id: number) => {
    if (!confirm('Deseja realmente remover este motor?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao deletar motor');
      carregarMotores();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 font-sans">
      <h1 className="text-3xl font-bold text-gray-800">Painel de Motores & ESP32</h1>

      {erro && (
        <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
          <p className="font-bold">Atenção</p>
          <p>{erro}</p>
        </div>
      )}

      {/* Formulário de Cadastro */}
      <section className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Cadastrar Novo Motor</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome do Motor</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Motor Trastejador #01"
                className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo / Categoria</label>
              <input
                type="text"
                required
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                placeholder="Ex: DC 220V / Trifásico"
                className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Seção de Sensores/ESPs */}
          <div className="mt-6 border-t pt-4">
            <h3 className="text-md font-medium text-gray-700 mb-3">Sensores / ESP32 Associados</h3>
            
            {sensores.map((sensor, index) => (
              <div key={index} className="flex flex-wrap md:flex-nowrap gap-3 items-end mb-3 bg-gray-50 p-3 rounded">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500">MAC Address do ESP</label>
                  <input
                    type="text"
                    required
                    placeholder="AA:BB:CC:DD:EE:FF"
                    value={sensor.macAddress}
                    onChange={(e) => handleSensorChange(index, 'macAddress', e.target.value)}
                    className="w-full border rounded p-1 text-sm"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-gray-500">Nº Escova</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={sensor.numeroEscova}
                    onChange={(e) => handleSensorChange(index, 'numeroEscova', parseInt(e.target.value) || 1)}
                    className="w-full border rounded p-1 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500">Modelo do Sensor</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: ESP32-WROOM-32"
                    value={sensor.modelo}
                    onChange={(e) => handleSensorChange(index, 'modelo', e.target.value)}
                    className="w-full border rounded p-1 text-sm"
                  />
                </div>
                {sensores.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerSensorCampo(index)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Remover
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={adicionarSensorCampo}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              + Adicionar outro sensor
            </button>
          </div>

          <button
            type="submit"
            className="w-full mt-4 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 font-medium transition"
          >
            Cadastrar Motor
          </button>
        </form>
      </section>

      {/* Listagem de Motores */}
      <section className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Motores Monitorados</h2>

        {carregando ? (
          <p className="text-gray-500 text-center py-4">Carregando motores...</p>
        ) : motores.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nenhum motor cadastrado.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {motores.map((motor) => (
              <div key={motor.id} className="border rounded-lg p-4 bg-gray-50 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{motor.nome}</h3>
                      <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded font-semibold">
                        {motor.tipo}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeletar(motor.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-semibold"
                    >
                      Excluir
                    </button>
                  </div>

                  {/* Detalhes dos Sensores */}
                  <div className="mt-4 border-t pt-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Sensores / ESPs ({motor.sensores.length})
                    </p>
                    <ul className="space-y-2">
                      {motor.sensores.map((sensor) => (
                        <li key={sensor.id} className="text-sm bg-white p-2 rounded border flex justify-between items-center">
                          <div>
                            <p className="font-mono text-xs font-bold text-gray-700">{sensor.id}</p>
                            <p className="text-xs text-gray-500">Escova #{sensor.numeroEscova} - {sensor.modelo}</p>
                          </div>
                          <span className={`h-2.5 w-2.5 rounded-full ${sensor.ipAtual ? 'bg-green-500' : 'bg-gray-300'}`} title={sensor.ipAtual ? `Online: ${sensor.ipAtual}` : 'Offline'} />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 text-right">
                  <span className="text-xs text-gray-400">ID do Motor: #{motor.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};