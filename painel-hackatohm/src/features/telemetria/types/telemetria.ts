import {
  NivelSeveridade,
  ResultadoGateRealtime,
} from '@/features/quality-gates/types/qualityGate';

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

/** Leitura de uma escova, vinda do hub (lote) ou do status do motor. */
export interface LeituraEscova {
  motorId: number | null;
  sensorId: string;
  espMacAddress?: string;
  numeroEscova: number;
  valorCelsius: number;
  dataHora: string;
  alertaDesgaste: boolean;
  resultadosQualityGates: ResultadoGateRealtime[];
}

export type SituacaoMotor = 'Online' | 'Degradado' | 'Offline';

export interface ContagemSeveridade {
  normal: number;
  atencao: number;
  alertaPreditivo: number;
  critico: number;
}

export interface MotivoStatus {
  numeroEscova: number;
  nomeRegra: string;
  tipoRegra: string;
  codigoRegra: string;
  valorObservado: number | null;
  valorLimite: number | null;
  mensagemDiagnostico: string | null;
}

export interface EscovaStatusDto {
  sensorId: string;
  numeroEscova: number;
  valorCelsius: number;
  severidade: NivelSeveridade;
  dataHora: string;
  alertaDesgaste: boolean;
  resultadosQualityGates: ResultadoGateRealtime[];
}

/** Status agregado: GET /api/motores/{id}/status e evento ReceberStatusMotor. */
export interface MotorStatusDto {
  motorId: number;
  severidadeGeral: NivelSeveridade;
  situacao: SituacaoMotor;
  contagem: ContagemSeveridade;
  motivo: MotivoStatus | null;
  escovas: EscovaStatusDto[];
}
