import { telemetriaStore } from '@/features/telemetria/store/telemetriaStore';
import { invalidarRegras } from '@/features/quality-gates/hooks/regrasVersao';

/**
 * O backend não envia evento quando regras mudam. Depois de criar vínculo,
 * editar, ativar, desativar ou excluir uma regra, o status dos motores
 * afetados é recarregado e os limites do medidor são relidos.
 * Sem `motorIds`, recarrega todos (a regra pode estar em qualquer motor).
 */
export function aposAlterarRegras(motorIds?: number[]): void {
  invalidarRegras();
  void (motorIds ? telemetriaStore.recarregarStatus(motorIds) : telemetriaStore.recarregarTodos());
}
