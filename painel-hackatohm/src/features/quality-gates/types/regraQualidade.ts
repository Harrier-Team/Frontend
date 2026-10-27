import { NivelSeveridade } from './qualityGate';

export type TipoRegra =
  | 'temperatura.limiar_estatico'
  | 'temperatura.gradiente_termico'
  | 'temperatura.assimetria_escovas';

export interface ParametrosRegra {
  aviso: number;
  critico: number;
}

export interface RegraQualidade {
  id: string;
  nome: string;
  descricao: string | null;
  tipoRegra: TipoRegra;
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
