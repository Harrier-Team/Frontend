import React from 'react';
import { EstadoDado } from '../helpers/estadoHelper';
import { ROTULO_DADO } from '../helpers/apresentacao';
import { formatarRelativo } from '../helpers/statusHelper';

/** Frescor do dado: o ESP está enviando? Conexão do hub não responde isso. */
export const FrescorIndicador: React.FC<{
  dado: EstadoDado;
  ultimoLoteEm: string | null;
  agora: number;
}> = ({ dado, ultimoLoteEm, agora }) => {
  const aoVivo = dado === 'ao-vivo';
  const apagado = dado === 'offline' || dado === 'degradado' || dado === 'sem-leitura';
  const idade = ultimoLoteEm ? formatarRelativo(ultimoLoteEm, agora) : null;

  return (
    <span className="inline-flex items-center gap-2 text-[13px] text-ink-2" role="status">
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{
          background: aoVivo ? 'var(--color-flare)' : 'transparent',
          border: aoVivo ? undefined : `1.5px solid ${apagado ? 'var(--color-data-off)' : 'var(--color-ink-3)'}`,
          animation: aoVivo ? 'flare-breathe 2.4s ease-in-out infinite' : undefined,
        }}
      />
      <span>
        {ROTULO_DADO[dado]}
        {idade && dado !== 'sem-leitura' && <span className="num text-ink-3"> · {idade}</span>}
        {(dado === 'atrasado' || dado === 'offline') && <span className="text-ink-3"> · desatualizado</span>}
      </span>
    </span>
  );
};
