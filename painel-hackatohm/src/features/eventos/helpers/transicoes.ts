import { resumirMotor } from '@/features/telemetria/helpers/resumoMotor';
import type { StatusConexaoHub } from '@/features/telemetria/services/signalrService';
import { MotorTelemetria } from '@/features/telemetria/store/tipos';
import { SituacaoMotor } from '@/features/telemetria/types/telemetria';

/**
 * Registro de conexão da sessão: só o que o backend não registra. Severidade e
 * alertas vêm dos alertas de manutenção, persistidos no servidor. Aqui ficam a
 * situação do motor (Online, Degradado, Offline) e as quedas do hub. Só
 * transições geram registro (ISA-18.2); vale para esta aba, em memória.
 */

export type TipoEvento = 'situacao' | 'hub';

export interface EventoSessao {
  /** Crescente e único na sessão. */
  id: number;
  /** Instante em que o painel percebeu a transição (ms). */
  em: number;
  /** Nulo nos eventos do hub, que não pertencem a um motor. */
  motorId: number | null;
  tipo: TipoEvento;
  /** Situação ou estado do hub anterior. */
  de: string | null;
  para: string;
}

export type NovoEvento = Omit<EventoSessao, 'id'>;

export interface SnapshotMotor {
  situacao: SituacaoMotor | null;
}

/** Estado do motor que importa para o registro, derivado do store. */
export function snapshotDoMotor(telemetria: MotorTelemetria, agora: number): SnapshotMotor {
  return { situacao: resumirMotor(telemetria, agora).situacao };
}

/** Compara dois retratos do mesmo motor: a situação mudou? Sem situação antes ou depois, não é transição. */
export function detectarTransicoes(motorId: number, antes: SnapshotMotor, depois: SnapshotMotor, em: number): NovoEvento[] {
  if (antes.situacao === null || depois.situacao === null || antes.situacao === depois.situacao) return [];
  return [{ em, motorId, tipo: 'situacao', de: antes.situacao, para: depois.situacao }];
}

/**
 * Queda e retomada do hub. Conectar pela primeira vez não é evento; perder a
 * conexão é, e a retomada só entra depois de uma queda registrada.
 */
export function detectarConexao(
  antes: StatusConexaoHub | null,
  depois: StatusConexaoHub,
  houveQueda: boolean,
  em: number
): { evento: NovoEvento | null; houveQueda: boolean } {
  if (antes === null || antes === depois) return { evento: null, houveQueda };
  if (antes === 'conectado') {
    // 'conectado' para qualquer outro estado é perda de conexão.
    return { evento: { em, motorId: null, tipo: 'hub', de: antes, para: depois }, houveQueda: true };
  }
  if (depois === 'conectado' && houveQueda) {
    return { evento: { em, motorId: null, tipo: 'hub', de: antes, para: depois }, houveQueda: false };
  }
  return { evento: null, houveQueda };
}

/** Adiciona o evento à lista (mais recente primeiro) respeitando o limite de memória. */
export function acumularEventos(atuais: EventoSessao[], novos: EventoSessao[], limite: number): EventoSessao[] {
  if (novos.length === 0) return atuais;
  return [...novos].reverse().concat(atuais).slice(0, limite);
}
