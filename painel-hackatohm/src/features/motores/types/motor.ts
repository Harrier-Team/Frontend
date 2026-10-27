/** Sensor como o backend espera em `sensoresIniciais`: o MAC do ESP vai em todos. */
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

/** Escova no formulário: o MAC é um só por motor, não por escova. */
export interface EscovaForm {
  numeroEscova: number | null;
  modelo: string;
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
