import { useEffect } from 'react';
import { signalRService } from '@/features/telemetria/services/signalrService';

/**
 * Entra no grupo do motor enquanto a página de detalhe está aberta
 * (`AssinarMotor`/`DesassinarMotor`). O hub devolve o snapshot de status na
 * hora. Reassina quando a conexão volta, porque o grupo se perde na queda.
 */
export function useAssinarMotor(motorId: number | null): void {
  useEffect(() => {
    if (motorId === null || Number.isNaN(motorId)) return;
    let assinou = false;

    const assinar = () => {
      assinou = true;
      signalRService.assinarMotor(motorId).catch(() => {
        assinou = false;
      });
    };

    const cancelar = signalRService.onStatusMudou((status) => {
      if (status === 'conectado') assinar();
    });

    return () => {
      cancelar();
      if (assinou) signalRService.desassinarMotor(motorId).catch(() => undefined);
    };
  }, [motorId]);
}
