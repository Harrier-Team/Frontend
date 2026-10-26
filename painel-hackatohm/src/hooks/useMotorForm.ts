import { useState } from 'react';
import { MotorInput, SensorInput } from '../types/motor';

const sensorInicial: SensorInput = {
  macAddress: '',
  numeroEscova: 1,
  modelo: 'ESP32-DS18B20',
};

export function validarMotorForm(nome: string, tipo: string, sensores: SensorInput[]) {
  if (!nome.trim() || !tipo.trim()) {
    return 'Informe o nome e o tipo do motor.';
  }

  if (
    sensores.some(
      (sensor) =>
        !sensor.macAddress.trim() ||
        !sensor.modelo.trim() ||
        sensor.numeroEscova <= 0
    )
  ) {
    return 'Todos os campos dos sensores (MAC, Escova e Modelo) são obrigatórios.';
  }

  return null;
}

export function useMotorForm() {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('');
  const [sensores, setSensores] = useState<SensorInput[]>([{ ...sensorInicial }]);

  const atualizarSensor = <K extends keyof SensorInput>(
    index: number,
    campo: K,
    valor: SensorInput[K]
  ) => {
    setSensores((atuais) =>
      atuais.map((sensor, sensorIndex) =>
        sensorIndex === index ? { ...sensor, [campo]: valor } : sensor
      )
    );
  };

  const adicionarSensor = () => {
    setSensores((atuais) => [
      ...atuais,
      { ...sensorInicial, numeroEscova: atuais.length + 1 },
    ]);
  };

  const removerSensor = (index: number) => {
    setSensores((atuais) =>
      atuais.length > 1 ? atuais.filter((_, sensorIndex) => sensorIndex !== index) : atuais
    );
  };

  const criarPayload = (): MotorInput => ({
    nome: nome.trim(),
    tipo: tipo.trim(),
    sensoresIniciais: sensores.map((sensor) => ({
      macAddress: sensor.macAddress.trim().toUpperCase(),
      numeroEscova: Number(sensor.numeroEscova),
      modelo: sensor.modelo.trim(),
    })),
  });

  const limpar = () => {
    setNome('');
    setTipo('');
    setSensores([{ ...sensorInicial }]);
  };

  return {
    nome,
    tipo,
    sensores,
    setNome,
    setTipo,
    atualizarSensor,
    adicionarSensor,
    removerSensor,
    criarPayload,
    limpar,
  };
}
