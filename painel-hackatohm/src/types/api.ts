export interface ApiErrorPayload {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
}

export class ApiRequestError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly traceId?: string;
  readonly fieldErrors: Record<string, string[]>;
  /** Mensagem do backend (`detail`/`title`), quando houve resposta. */
  readonly detail?: string;

  constructor(message: string, payload: ApiErrorPayload = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = payload.status;
    this.code = payload.code;
    this.traceId = payload.traceId;
    this.fieldErrors = payload.errors ?? {};
    this.detail = payload.detail ?? payload.title;
  }

  /** Sem resposta da API: rede fora, backend parado ou tempo esgotado. */
  get semResposta(): boolean {
    return this.status === undefined;
  }

  /** A API respondeu com erro de servidor (5xx). */
  get erroDeServidor(): boolean {
    return this.status !== undefined && this.status >= 500;
  }
}
