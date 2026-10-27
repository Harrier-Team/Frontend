import { NivelSeveridade } from './qualityGate';

export type TipoRegra = 'temperatura.limiar_estatico'
  | 'temperatura.gradiente_termico' | 'temperatura.assimetria_escovas';

export interface ParametrosLimiarTemperatura {
  aviso: number;
  critico: number;
}

export interface RegraQualidade {
  id: string;
  nome: string;
  descricao: string | null;
  tipoRegra: string;
  severidadePadrao: NivelSeveridade;
  parametros: ParametrosLimiarTemperatura;
  ativo: boolean;
  criadoEm: string;
}

export interface RegraQualidadeRequest {
  tipoRegra: TipoRegra;
  nome: string;
  descricao?: string | null;
  parametros: ParametrosLimiarTemperatura;
  ativo: boolean;
}

export interface VinculoRegraQualidade {
  motorId: number;
  regraQualidadeId: string;
  ativo: boolean;
  vinculadoEm: string;
  regra: RegraQualidade;
}
