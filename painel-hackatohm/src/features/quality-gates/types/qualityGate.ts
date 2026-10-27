export type NivelSeveridade =
  | 'Normal'
  | 'Atencao'
  | 'AlertaPreditivo'
  | 'Critico';

export type SeveridadeGate = NivelSeveridade | 'Indisponivel' | 'DadosInsuficientes';

export interface ResultadoGateRealtime {
  regraQualidadeId: string;
  nomeRegra: string;
  disparouAlerta: boolean;
  severidade: SeveridadeGate;
  tipoRegra: string;
  codigoRegra: string;
  mensagemDiagnostico: string;
  valorObservado: number | null;
  valorLimite: number | null;
  metadados: Record<string, unknown> | null;
}

// O HTTP usa nomes de enum; o protocolo JSON atual do SignalR usa seus numeros.
export type CodigoSeveridade = 0 | 1 | 2 | 3;
export type ResultadoGateRecebido = Omit<ResultadoGateRealtime, 'severidade'> & {
  severidade?: unknown;
};
