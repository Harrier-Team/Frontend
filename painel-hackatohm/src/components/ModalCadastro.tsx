import React, { useState } from 'react';
import { X, Plus, Trash2, Cpu } from 'lucide-react';
import { MotorInput, SensorInput } from '../types/motor';

interface ModalCadastroProps {
  aberto: boolean;
  onFechar: () => void;
  onCadastrar: (dados: MotorInput) => Promise<any>;
}

export const ModalCadastro: React.FC<ModalCadastroProps> = ({
  aberto,
  onFechar,
  onCadastrar,
}) => {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('');
  const [sensores, setSensores] = useState<SensorInput[]>([
    { macAddress: '', numeroEscova: 1, modelo: 'ESP32-DS18B20' },
  ]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!aberto) return null;

  const handleSensorChange = (
    index: number,
    field: keyof SensorInput,
    valor: any
  ) => {
    const atualizados = [...sensores];
    atualizados[index] = { ...atualizados[index], [field]: valor };
    setSensores(atualizados);
  };

  const handleAdicionarSensor = () => {
    setSensores([
      ...sensores,
      {
        macAddress: '',
        numeroEscova: sensores.length + 1,
        modelo: 'ESP32-DS18B20',
      },
    ]);
  };

  const handleRemoverSensor = (index: number) => {
    if (sensores.length <= 1) return;
    setSensores(sensores.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    // Validação básica
    if (!nome.trim() || !tipo.trim()) {
      setErro('Informe o nome e o tipo do motor.');
      return;
    }

    for (const sensor of sensores) {
      if (!sensor.macAddress.trim() || !sensor.modelo.trim() || sensor.numeroEscova <= 0) {
        setErro('Todos os campos dos sensores (MAC, Escova e Modelo) são obrigatórios.');
        return;
      }
    }

    setSalvando(true);
    try {
      await onCadastrar({
        nome: nome.trim(),
        tipo: tipo.trim(),
        sensoresIniciais: sensores.map((s) => ({
          macAddress: s.macAddress.trim().toUpperCase(),
          numeroEscova: Number(s.numeroEscova),
          modelo: s.modelo.trim(),
        })),
      });

      // Limpar formulário e fechar
      setNome('');
      setTipo('');
      setSensores([{ macAddress: '', numeroEscova: 1, modelo: 'ESP32-DS18B20' }]);
      onFechar();
    } catch (err: any) {
      setErro(err.message || 'Erro ao cadastrar motor');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Novo Motor</h2>
              <p className="text-xs text-slate-500">
                Cadastre o motor e vincule os sensores ESP32 das escovas
              </p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {erro && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
              ⚠️ {erro}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Nome do Motor *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Motor Trastejador #01"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Tipo / Categoria *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Trifásico 220V"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
          </div>

          {/* Sensores das Escovas */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Sensores ESP32 das Escovas ({sensores.length})
                </label>
                <p className="text-[11px] text-slate-500">
                  Informe o MAC Address do ESP32 de cada escova monitorada
                </p>
              </div>

              <button
                type="button"
                onClick={handleAdicionarSensor}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Escova</span>
              </button>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {sensores.map((sensor, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap sm:flex-nowrap gap-2 items-center text-xs"
                >
                  <div className="w-16">
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                      Escova #
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={sensor.numeroEscova}
                      onChange={(e) =>
                        handleSensorChange(
                          idx,
                          'numeroEscova',
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-full border border-slate-300 rounded px-2 py-1.5 font-bold text-center bg-white"
                    />
                  </div>

                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                      MAC Address ESP32
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="AA:BB:CC:DD:EE:FF"
                      value={sensor.macAddress}
                      onChange={(e) =>
                        handleSensorChange(idx, 'macAddress', e.target.value)
                      }
                      className="w-full border border-slate-300 rounded px-2 py-1.5 font-mono uppercase bg-white"
                    />
                  </div>

                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                      Modelo do Sensor
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: DS18B20"
                      value={sensor.modelo}
                      onChange={(e) =>
                        handleSensorChange(idx, 'modelo', e.target.value)
                      }
                      className="w-full border border-slate-300 rounded px-2 py-1.5 bg-white"
                    />
                  </div>

                  {sensores.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoverSensor(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded mt-4 sm:mt-3"
                      title="Remover esta escova"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé com botões de ação */}
          <div className="border-t border-slate-100 pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-lg transition shadow-xs disabled:opacity-50"
            >
              {salvando ? 'Cadastrando...' : 'Salvar Motor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

