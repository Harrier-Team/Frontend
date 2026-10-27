import { useEffect, useState } from 'react';
import { ParametrosRegra } from '@/features/quality-gates/types/regraQualidade';
import { limitesDoLimiarEstatico } from '@/features/quality-gates/helpers/limitesHelper';
import { useVersaoRegras } from '@/features/quality-gates/hooks/regrasVersao';
import { vinculoRegraQualidadeService } from '../services/vinculoRegraQualidadeService';

/**
 * Limites de aviso e crítico da regra de limiar estático vinculada ao motor,
 * para o medidor. Null enquanto carrega, sem regra ou se a consulta falhar:
 * nesses casos o medidor não desenha faixas.
 */
export function useLimitesTermicos(motorId: number): ParametrosRegra | null {
  const versao = useVersaoRegras();
  const [limites, setLimites] = useState<ParametrosRegra | null>(null);

  useEffect(() => {
    let cancelado = false;
    vinculoRegraQualidadeService
      .listarPorMotor(motorId)
      .then((vinculos) => {
        if (!cancelado) setLimites(limitesDoLimiarEstatico(vinculos));
      })
      .catch(() => {
        if (!cancelado) setLimites(null);
      });
    return () => {
      cancelado = true;
    };
  }, [motorId, versao]);

  return limites;
}
