import { NivelSeveridade } from './qualityGate';

export type TipoRegra =
  | 'temperatura.limiar_estatico'
  | 'temperatura.gradiente_termico'
  | 'temperatura.assimetria_escovas'
  | 'temperatura.previsao_tendencia';

export interface ParametrosRegra {
  /**
   * Nos tipos de temperatura, o limite de aviso. Na previsão por tendência,
   * os minutos de antecedência do aviso (maior que o crítico).
   */
  aviso: number;
  critico: number;
  /** Só na previsão por tendência: °C a antecipar, de -55 a 200. */
  temperaturaLimite?: number;
  /** Só na previsão por tendência: leituras no ajuste, inteiro de 5 a 60 (padrão do backend: 12). */
  janela?: number;
}

export interface RegraQualidade {
  id: string;
  nome: string;
  descricao: string | null;
  /** Pode vir um tipo que o painel não conhece. */
  tipoRegra: TipoRegra | (string & {});
  severidadePadrao: NivelSeveridade;
  parametros: ParametrosRegra;
  ativo: boolean;
  criadoEm: string;
}

/** Corpo do POST e do PUT: no PUT o objeto vai completo, incluindo `tipoRegra`. */
export interface RegraQualidadeRequest {
  nome: string;
  descricao?: string | null;
  tipoRegra: TipoRegra;
  parametros: ParametrosRegra;
  ativo: boolean;
}

export interface VinculoRegraQualidade {
  motorId: number;
  regraQualidadeId: string;
  ativo: boolean;
  vinculadoEm: string;
  regra: RegraQualidade;
}
