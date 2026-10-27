import React from 'react';
import { Button } from './Button';

interface ApiErrorStateProps {
  title?: string;
  message: string;
  /** Detalhe técnico, recolhido por padrão. */
  detalhe?: string;
  onRetry?: () => void;
  retrying?: boolean;
  action?: React.ReactNode;
}

/**
 * Falha ao falar com a API. Ocupa o lugar do conteúdo, para que um erro nunca
 * pareça uma lista vazia ou um item inexistente.
 */
export const ApiErrorState: React.FC<ApiErrorStateProps> = ({
  title = 'Não foi possível carregar os dados',
  message,
  detalhe,
  onRetry,
  retrying = false,
  action,
}) => (
  <div
    role="alert"
    className="rounded-[var(--radius-panel)] border border-line-strong px-6 py-14 text-center"
  >
    <h2 className="display text-base">{title}</h2>
    <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">{message}</p>
    {detalhe && (
      <details className="mx-auto mt-4 max-w-md text-left text-[13px] text-ink-3">
        <summary className="cursor-pointer text-center">Detalhe técnico</summary>
        <p className="mt-2 break-words font-mono">{detalhe}</p>
      </details>
    )}
    <div className="mt-6 flex items-center justify-center gap-2">
      {onRetry && (
        <Button variant="secondary" busy={retrying} onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
      {action}
    </div>
  </div>
);
