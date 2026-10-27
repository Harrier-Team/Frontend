import React from 'react';
import { Button } from './Button';

interface ApiErrorStateProps {
  title?: string;
  message: string;
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
