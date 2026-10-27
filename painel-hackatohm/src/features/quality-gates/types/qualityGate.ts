export type NivelSeveridade =
  | 'Normal'
  | 'Atencao'
  | 'AlertaPreditivo'
  | 'Critico';

export interface ResultadoGateRealtime {
  regraQualidadeId: string;
  nomeRegra: string;
  disparouAlerta: boolean;
  severidade: NivelSeveridade;
  tipoRegra: string;
  codigoRegra: string;
  mensagemDiagnostico: string | null;
  valorObservado: number | null;
  valorLimite: number | null;
  metadados: Record<string, unknown> | null;
}
