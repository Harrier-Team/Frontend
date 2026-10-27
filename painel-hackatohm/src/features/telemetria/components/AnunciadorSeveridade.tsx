import React, { useEffect, useRef, useState } from 'react';
import { EstadoPrincipal } from '../helpers/estadoHelper';
import { TEMA_ESTADO } from '../helpers/apresentacao';

export interface EstadoDoMotor {
  id: number;
  nome: string;
  principal: EstadoPrincipal;
}

/**
 * Anuncia a mudança de estado de um motor para leitores de tela: Crítico em
 * `assertive`, o resto em `polite`, uma vez por transição. A primeira carga
 * não anuncia nada.
 */
export const AnunciadorSeveridade: React.FC<{ motores: EstadoDoMotor[] }> = ({ motores }) => {
  const anteriores = useRef<Map<number, EstadoPrincipal> | null>(null);
  // `n` troca o <span> a cada anúncio: a mesma frase de novo (Crítico, Normal, Crítico)
  // ainda é lida, porque o leitor de tela só fala quando o conteúdo da região muda.
  const [polite, setPolite] = useState({ texto: '', n: 0 });
  const [assertive, setAssertive] = useState({ texto: '', n: 0 });

  useEffect(() => {
    const mapa = anteriores.current;
    const agora = new Map(motores.map((m) => [m.id, m.principal]));
    anteriores.current = agora;
    if (!mapa) return;

    const criticos: string[] = [];
    const outros: string[] = [];
    for (const motor of motores) {
      const antes = mapa.get(motor.id);
      if (antes === undefined || antes === motor.principal) continue;
      const frase = `${motor.nome}: ${TEMA_ESTADO[motor.principal].label}`;
      (motor.principal === 'Critico' ? criticos : outros).push(frase);
    }
    // Anúncio dirigido por mudança de dados externos.
    // oxlint-disable-next-line react/set-state-in-effect
    if (criticos.length > 0) setAssertive((a) => ({ texto: criticos.join('. '), n: a.n + 1 }));
    if (outros.length > 0) setPolite((a) => ({ texto: outros.join('. '), n: a.n + 1 }));
  }, [motores]);

  return (
    <>
      <div aria-live="polite" role="status" className="sr-only">
        <span key={polite.n}>{polite.texto}</span>
      </div>
      <div aria-live="assertive" role="alert" className="sr-only">
        <span key={assertive.n}>{assertive.texto}</span>
      </div>
    </>
  );
};
