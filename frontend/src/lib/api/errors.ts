/** Error shape shared by every API call: `{ code, message, details }`. */
export type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }

  toJSON(): ApiErrorBody & { status: number } {
    return { status: this.status, code: this.code, message: this.message, details: this.details };
  }
}

const defaultMessages: Record<number, string> = {
  400: 'La demande est invalide.',
  401: 'Votre session a expiré. Veuillez vous reconnecter.',
  403: "Vous n'avez pas accès à cette ressource.",
  404: 'Élément introuvable.',
  409: 'Cet élément a été modifié entre-temps. Rechargez la page.',
  422: 'Certains champs sont invalides.',
  429: 'Trop de tentatives. Réessayez dans quelques minutes.',
};

const defaultCode: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_FAILED',
  429: 'TOO_MANY_REQUESTS',
};

/**
 * Normalizes any error payload (our `{ code, message, details }`, or NestJS's default
 * `{ statusCode, message, error }`) into an ApiError with a French message.
 */
export function toApiError(status: number, payload: unknown): ApiError {
  const body = (payload ?? {}) as Record<string, unknown>;
  const fallback = defaultMessages[status] ?? 'Une erreur inattendue est survenue.';

  if (typeof body.code === 'string' && typeof body.message === 'string') {
    return new ApiError(status, { code: body.code, message: body.message, details: body.details });
  }

  // NestJS ValidationPipe: message is an array of strings.
  const details = Array.isArray(body.message) ? body.message : undefined;
  return new ApiError(status, {
    code: defaultCode[status] ?? (typeof body.error === 'string' ? body.error : 'UNKNOWN'),
    message: fallback,
    details,
  });
}

/** Extracts per-field messages from `details: [{ field, message }]`. */
export function fieldErrors(error: ApiError): FieldErrors {
  if (!Array.isArray(error.details)) return {};
  const result: FieldErrors = {};
  for (const item of error.details) {
    if (item && typeof item === 'object' && 'field' in item && 'message' in item) {
      result[String(item.field)] = String(item.message);
    }
  }
  return result;
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}
