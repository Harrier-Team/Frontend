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

  constructor(message: string, payload: ApiErrorPayload = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = payload.status;
    this.code = payload.code;
    this.traceId = payload.traceId;
    this.fieldErrors = payload.errors ?? {};
  }
}
