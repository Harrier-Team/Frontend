import { NivelSeveridade } from '@/features/quality-gates/types/qualityGate';

/** Categoria do backend: `Preditivo`, `Aceleracao` ou `Condicao`. Pode chegar uma que o painel não conhece. */
export type CategoriaAlerta = 'Preditivo' | 'Aceleracao' | 'Condicao' | (string & {});

/**
 * Alerta de manutenção persistido pelo backend: um evento que abre quando um
 * gate passa a disparar, é atualizado enquanto continua e encerra
 * (`resolvidoEm`) quando para. Item de `GET /api/alertas` e do evento
 * `ReceberAlertaManutencao`.
 */
export interface AlertaManutencao {
  id: number;
  motorId: number;
  /** Nulo na assimetria, que descreve o motor inteiro. */
  sensorId: string | null;
  numeroEscova: number | null;
  /** Nulo quando a regra foi excluída; o alerta mantém nome, tipo e código. */
  regraQualidadeId: string | null;
  nomeRegra: string;
  /** Pode vir um tipo que o painel não conhece. */
  tipoRegra: string;
  categoria: CategoriaAlerta;
  codigoRegra: string;
  /** Severidade atual; desconhecida vira `SemClassificacao`, nunca Normal. */
  severidade: NivelSeveridade;
  /** Unidade depende do `tipoRegra`: °C, °C/min ou minutos (previsão). */
  valorObservado: number | null;
  valorLimite: number | null;
  /** Texto do backend (decimal com ponto): detalhe técnico, não o texto principal. */
  mensagem: string;
  iniciadoEm: string;
  atualizadoEm: string;
  resolvidoEm: string | null;
  ativo: boolean;
}

export interface PaginaAlertas {
  itens: AlertaManutencao[];
  pagina: number;
  tamanho: number;
  total: number;
}
