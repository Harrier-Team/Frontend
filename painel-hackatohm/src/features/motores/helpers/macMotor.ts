import { MotorTelemetria } from '@/features/telemetria/store/tipos';

const CHAVE = (motorId: number) => `harrier:mac:${motorId}`;

/**
 * O backend não devolve o MAC do ESP no cadastro nem no detalhe do motor; ele
 * só chega nos lotes (`espMacAddress`). Para mostrar o MAC antes do primeiro
 * lote, o cadastro o guarda nesta aba (sessionStorage), só como conveniência.
 */
export function guardarMacDoMotor(motorId: number, mac: string): void {
  try {
    sessionStorage.setItem(CHAVE(motorId), mac);
  } catch {
    // Sem armazenamento (modo privado, bloqueio): o MAC aparece com o primeiro lote.
  }
}

export function lerMacDoMotor(motorId: number): string | null {
  try {
    return sessionStorage.getItem(CHAVE(motorId));
  } catch {
    return null;
  }
}

/** MAC do ESP: o do lote mais recente tem prioridade; depois o informado no cadastro. */
export function escolherMac(
  telemetria: MotorTelemetria | undefined,
  informado: string | null | undefined
): string | null {
  for (const serie of Object.values(telemetria?.escovas ?? {})) {
    const mac = serie.ultima?.espMacAddress;
    if (mac) return mac;
  }
  return informado ?? null;
}
