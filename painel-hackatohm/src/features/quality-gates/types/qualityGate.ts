export type NivelSeveridade =
  | 'Normal'
  | 'Atencao'
  | 'AlertaPreditivo'
  | 'Critico'
  /**
   * Criado pelo painel, nunca enviado pelo backend: severidade ausente ou que
   * o painel não reconhece. Nunca é tratada como Normal.
   */
  | 'SemClassificacao';

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
