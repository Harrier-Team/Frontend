import { ApiRequestError } from '../types/api';

export function obterMensagemErro(
  error: unknown,
  fallback = 'Não foi possível concluir a operação.'
): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 409) {
      return error.message || 'A operação entrou em conflito com o estado atual.';
    }

    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

export function obterErrosDeCampo(error: unknown): Record<string, string[]> {
  return error instanceof ApiRequestError ? error.fieldErrors : {};
}
