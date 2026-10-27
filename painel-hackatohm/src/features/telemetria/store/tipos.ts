import { NivelSeveridade } from '@/features/quality-gates/types/qualityGate';
import { LeituraEscova, MotorStatusDto } from '@/features/telemetria/types/telemetria';
import type { StatusConexaoHub } from '@/features/telemetria/services/signalrService';

/** Ponto da curva de uma escova (janela da sessão). */
export interface PontoEscova {
  /** Instante da leitura (ms desde a época), do `dataHora` do servidor. */
  t: number;
  v: number;
  severidade: NivelSeveridade | null;
}

export interface SerieEscova {
  ultima: LeituraEscova | null;
  /** Buffer circular ordenado por `t`, com no máximo MAX_PONTOS pontos. */
  pontos: PontoEscova[];
}

export interface MotorTelemetria {
  motorId: number;
  status: MotorStatusDto | null;
  /** Maior `dataHora` das escovas do status; permite recusar status mais antigo. */
  statusVersao: number | null;
  /** Quando o status foi aplicado, em ms do relógio do cliente. */
  statusAtualizadoEm: number | null;
  escovas: Record<number, SerieEscova>;
  /** Maior `dataHora` já vista para o motor (lote do hub ou status). */
  ultimoLoteEm: string | null;
  /** Lotes recebidos pelo hub nesta sessão (só `ReceberLoteTelemetria`). */
  lotesNaSessao: number;
  carregando: boolean;
  /** Já houve uma resposta do status (sucesso ou 404). */
  carregado: boolean;
  /** Mensagem amigável da última falha ao consultar o status. */
  erro: string | null;
}

export interface EstadoTelemetria {
  motores: Record<number, MotorTelemetria>;
  conexao: StatusConexaoHub;
  /** Último dado recebido, em ms do relógio do cliente. */
  ultimaAtualizacao: number | null;
}
