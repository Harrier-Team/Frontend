import React from 'react';
import { CircleSlash2, WifiOff } from 'lucide-react';
import { EstadoDado } from '../helpers/estadoHelper';
import { ROTULO_DADO } from '../helpers/apresentacao';
import { formatarRelativo } from '../helpers/statusHelper';

interface FreshnessIndicatorProps {
  dado: EstadoDado;
  ultimoLoteEm: string | null;
  /** Relógio global (`useAgora`): um único timer para todos os indicadores. */
  agora: number;
  /** Só ponto e idade, sem o rótulo do estado. */
  compacto?: boolean;
}

/**
 * Frescor do dado: o ESP está enviando? A conexão do hub não responde isso.
 * Ao vivo respira em `flare`; atrasado fica cinza; degradado e offline usam
 * símbolo próprio em `data-off`.
 */
export const FreshnessIndicator: React.FC<FreshnessIndicatorProps> = ({
  dado,
  ultimoLoteEm,
  agora,
  compacto = false,
}) => {
  if (dado === 'sem-leitura') return null;
  const idade = ultimoLoteEm ? formatarRelativo(ultimoLoteEm, agora) : null;
  const desatualizado = dado === 'atrasado' || dado === 'offline';

  let marca: React.ReactNode;
  if (dado === 'offline') {
    marca = <WifiOff width={14} height={14} aria-hidden="true" style={{ color: 'var(--color-data-off)' }} />;
  } else if (dado === 'degradado') {
    marca = (
      <CircleSlash2 width={14} height={14} aria-hidden="true" style={{ color: 'var(--color-data-off)' }} />
    );
  } else {
    const aoVivo = dado === 'ao-vivo';
    marca = (
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{
          background: aoVivo ? 'var(--color-flare)' : 'var(--color-ink-3)',
          boxShadow: aoVivo ? '0 0 8px color-mix(in srgb, var(--color-flare) 70%, transparent)' : undefined,
          animation: aoVivo ? 'flare-breathe 2.4s ease-in-out infinite' : undefined,
        }}
      />
    );
  }

  const textoIdade = idade;

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-[13px] text-ink-2">
      <span className="inline-flex w-3.5 justify-center">{marca}</span>
      <span>
        {!compacto && ROTULO_DADO[dado]}
        {!compacto && textoIdade && ' · '}
        {textoIdade && <span className="num text-ink-3">{textoIdade}</span>}
        {desatualizado && !compacto && <span className="text-ink-3"> · desatualizado</span>}
      </span>
    </span>
  );
};
