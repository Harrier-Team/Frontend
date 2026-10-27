import { ApiRequestError } from '../types/api';

/** Mensagens para os `code` do Problem Details que o painel conhece. */
const MENSAGENS_POR_CODIGO: Record<string, string> = {
  quality_rule_already_linked: 'Esta regra já está vinculada a este motor.',
  sensors_already_registered:
    'Este MAC ou algum número de escova já está cadastrado em outro motor. Confira os dados e tente de novo.',
  sensor_already_registered: 'Já existe um sensor com este identificador.',
  invalid_payload: 'Há dados inválidos no cadastro. Confira os campos abaixo.',
};

export const MENSAGEM_SEM_RESPOSTA =
  'Não foi possível falar com a API. Verifique se o backend está em execução e tente de novo.';
export const MENSAGEM_SERVIDOR_INDISPONIVEL =
  'A API está indisponível no momento. Aguarde alguns instantes e tente de novo.';
export const MENSAGEM_ERRO_INTERNO = 'A API encontrou um erro ao processar o pedido. Tente de novo.';

/**
 * Texto para o usuário. Falha de rede e 5xx nunca mostram a mensagem crua
 * do axios ("Request failed with status code 502").
 */
export function obterMensagemErro(
  error: unknown,
  fallback = 'Não foi possível concluir a operação.'
): string {
  if (error instanceof ApiRequestError) {
    if (error.semResposta) return MENSAGEM_SEM_RESPOSTA;

    if (error.code && MENSAGENS_POR_CODIGO[error.code]) {
      return MENSAGENS_POR_CODIGO[error.code];
    }

    if (error.erroDeServidor) {
      return error.status === 500 ? MENSAGEM_ERRO_INTERNO : MENSAGEM_SERVIDOR_INDISPONIVEL;
    }

    if (error.status === 404) return 'O item não foi encontrado. Ele pode ter sido removido.';
    if (error.status === 409) {
      return error.detail || 'A operação entrou em conflito com o estado atual.';
    }

    return error.detail || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

/** Falha de infraestrutura (rede ou 5xx): nunca deve parecer lista vazia ou "não encontrado". */
export function ehFalhaDeInfraestrutura(error: unknown): boolean {
  return error instanceof ApiRequestError && (error.semResposta || error.erroDeServidor);
}

export function ehNaoEncontrado(error: unknown): boolean {
  return error instanceof ApiRequestError && error.status === 404;
}

export function obterErrosDeCampo(error: unknown): Record<string, string[]> {
  return error instanceof ApiRequestError ? error.fieldErrors : {};
}

/** Mensagens por campo do Problem Details (`errors`), sem repetição, para listar ao usuário. */
export function listarErrosDeCampo(error: unknown): string[] {
  const mensagens = Object.values(obterErrosDeCampo(error)).flat();
  return [...new Set(mensagens.filter((m) => typeof m === 'string' && m.trim() !== ''))];
}
