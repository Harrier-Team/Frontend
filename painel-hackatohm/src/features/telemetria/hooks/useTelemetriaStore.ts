import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { MotorResponse } from '@/features/motores/types/motor';
import { StatusConexaoHub } from '@/features/telemetria/services/signalrService';
import { MotorTelemetria } from '@/features/telemetria/store/tipos';
import { telemetriaStore } from '@/features/telemetria/store/telemetriaStore';

/** Telemetria de um motor. Re-renderiza só quando aquele motor muda. */
export function useMotorTelemetria(motorId: number): MotorTelemetria | undefined {
  return useSyncExternalStore(telemetriaStore.subscribe, () => telemetriaStore.obterMotor(motorId));
}

/** Telemetria de todos os motores (visão geral). */
export function useTelemetriaMotores(): Record<number, MotorTelemetria> {
  return useSyncExternalStore(telemetriaStore.subscribe, () => telemetriaStore.obterEstado().motores);
}

export function useConexaoHub(): StatusConexaoHub {
  return useSyncExternalStore(telemetriaStore.subscribe, telemetriaStore.obterConexao);
}

/**
 * Liga o hub e a vigia de silêncio e mantém o store com os motores cadastrados.
 * Usado uma única vez, no provedor.
 */
export function useSincronizarTelemetria(motores: MotorResponse[]): void {
  useEffect(() => telemetriaStore.iniciar(), []);

  const chave = useMemo(() => motores.map((motor) => motor.id).join(','), [motores]);
  useEffect(() => {
    telemetriaStore.definirMotores(chave ? chave.split(',').map(Number) : []);
  }, [chave]);
}
