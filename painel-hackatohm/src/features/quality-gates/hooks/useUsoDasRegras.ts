import { useEffect, useState } from 'react';
import { motorService } from '@/features/motores/services/motorService';
import { vinculoRegraQualidadeService } from '@/features/motores/services/vinculoRegraQualidadeService';
import { useVersaoRegras } from './regrasVersao';

/**
 * Quantos motores usam cada regra (vínculo ativo). O backend não tem uma rota
 * para isso, então são N+1 consultas (motores e o vínculo de cada um).
 * Retorna null enquanto carrega ou se alguma consulta falhar: a tela só omite
 * a contagem, sem tratar a falha como "nenhum motor".
 */
export function useUsoDasRegras(): Record<string, number> | null {
  const versao = useVersaoRegras();
  const [uso, setUso] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const motores = await motorService.listar();
        const listas = await Promise.all(
          motores.map((motor) => vinculoRegraQualidadeService.listarPorMotor(motor.id))
        );
        const contagem: Record<string, number> = {};
        for (const lista of listas) {
          for (const vinculo of lista) {
            if (vinculo.ativo) {
              contagem[vinculo.regraQualidadeId] = (contagem[vinculo.regraQualidadeId] ?? 0) + 1;
            }
          }
        }
        if (!cancelado) setUso(contagem);
      } catch {
        if (!cancelado) setUso(null);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [versao]);

  return uso;
}
