import { ResultadoGateRealtime } from './qualityGate';

export interface TelemetriaRealtimeDto {
  sensorId: string;
  espMacAddress: string;
  numeroEscova: number;
  valorCelsius: number;
  dataHora: string;
  alertaDesgaste: boolean;
  motorId: number | null;
  resultadosQualityGates?: ResultadoGateRealtime[];
}

export interface LeituraMaisRecente {
  sensorId: string;
  valorCelsius: number;
  dataHora: string;
  alertaDesgaste: boolean;
  resultadosQualityGates: ResultadoGateRealtime[];
}

export type NivelStatus = 'normal' | 'warning' | 'perigo' | 'offline';

export interface SensorComTelemetria {
  id: string;
  numeroEscova: number;
  modelo: string;
  ipAtual?: string;
  ultimaConexao?: string;
  ultimaLeitura?: LeituraMaisRecente;
  status: NivelStatus;
}

export interface MotorComStatus {
  id: number;
  nome: string;
  tipo: string;
  sensores: SensorComTelemetria[];
  statusGeral: NivelStatus;
  temperaturaMaxima: number | null;
  totalAlertas: number;
}
