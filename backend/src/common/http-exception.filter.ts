import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { QueryFailedError } from 'typeorm';
import type { ZodError } from 'zod';

import type { ErrorBody, FieldError } from './app-error';

const DEFAULTS: Record<number, [string, string]> = {
  400: ['BAD_REQUEST', 'La demande est invalide.'],
  401: ['UNAUTHORIZED', 'Authentification requise.'],
  403: ['FORBIDDEN', "Vous n'avez pas accès à cette ressource."],
  404: ['NOT_FOUND', 'Élément introuvable.'],
  409: ['CONFLICT', 'Cet élément a été modifié entre-temps.'],
  422: ['VALIDATION_FAILED', 'Certains champs sont invalides.'],
  429: ['TOO_MANY_REQUESTS', 'Trop de tentatives. Réessayez dans quelques minutes.'],
  500: ['INTERNAL_ERROR', 'Une erreur inattendue est survenue.'],
};

/** Readable messages for database constraints, so a trigger or a unique index becomes a clean 409. */
const CONSTRAINTS: Record<string, { code: string; field?: string; message: string }> = {
  users_email_key: { code: 'EMAIL_TAKEN', field: 'email', message: 'Un compte existe déjà avec ce courriel.' },
  members_email_key: { code: 'EMAIL_TAKEN', field: 'email', message: 'Un membre existe déjà avec ce courriel.' },
  consents_one_active: { code: 'CONSENT_ALREADY_ACTIVE', message: 'Ce consentement est déjà actif.' },
};

const fromDefaults = (status: number, message?: string, details?: unknown): ErrorBody => {
  const [code, fallback] = DEFAULTS[status] ?? DEFAULTS[500];
  return { code, message: message ?? fallback, ...(details === undefined ? {} : { details }) };
};

export function zodDetails(error: ZodError): FieldError[] {
  return error.issues.map((issue) => ({ field: issue.path.join('.') || '_', message: issue.message }));
}

/** Maps any exception to { code, message, details } with a French message. */
export function toErrorResponse(exception: unknown): { status: number; body: ErrorBody } {
  if (exception instanceof ZodValidationException) {
    const details = zodDetails(exception.getZodError() as ZodError);
    return { status: 422, body: fromDefaults(422, undefined, details) };
  }
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const response = exception.getResponse();
    if (typeof response === 'object' && response && 'code' in response) return { status, body: response as ErrorBody };
    return { status, body: fromDefaults(status) };
  }
  if (exception instanceof QueryFailedError) {
    const driver = exception.driverError as { code?: string; constraint?: string };
    if (driver.code === '23505') {
      const known = driver.constraint ? CONSTRAINTS[driver.constraint] : undefined;
      const details = known?.field ? [{ field: known.field, message: known.message }] : undefined;
      return { status: 409, body: known ? { code: known.code, message: known.message, details } : fromDefaults(409) };
    }
    if (driver.code === 'P0409') return { status: 409, body: { code: 'ALREADY_DECIDED', message: 'Cette demande a déjà été traitée.' } };
    if (driver.code === '23514') return { status: 422, body: fromDefaults(422) };
    if (driver.code === '23503') return { status: 409, body: fromDefaults(409, 'Cet élément est lié à d’autres données.') };
  }
  return { status: HttpStatus.INTERNAL_SERVER_ERROR, body: fromDefaults(500) };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Errors');

  catch(exception: unknown, host: ArgumentsHost) {
    const { status, body } = toErrorResponse(exception);
    if (status >= 500) this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    host.switchToHttp().getResponse<Response>().status(status).json(body);
  }
}
