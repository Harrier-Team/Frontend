export interface SensorInput {
  macAddress: string;
  numeroEscova: number;
  modelo: string;
}

export interface MotorInput {
  nome: string;
  tipo: string;
  sensoresIniciais: SensorInput[];
}

export interface SensorResponse {
  id: string;
  numeroEscova: number;
  modelo: string;
  ipAtual?: string;
  ultimaConexao?: string;
}

export interface SensorInputWithMotor extends SensorInput {
  motorId: number;
}

export interface MotorResponse {
  id: number;
  nome: string;
  tipo: string;
  sensores: SensorResponse[];
}