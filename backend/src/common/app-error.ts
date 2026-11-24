import { HttpException } from '@nestjs/common';

export type FieldError = { field: string; message: string };
export type ErrorBody = { code: string; message: string; details?: unknown };

/** Business error with the shape the frontend expects: { code, message, details }. */
export class AppError extends HttpException {
  constructor(status: number, code: string, message: string, details?: FieldError[] | unknown) {
    super({ code, message, ...(details === undefined ? {} : { details }) } satisfies ErrorBody, status);
  }
}

export const notFound = (message = 'Élément introuvable.') => new AppError(404, 'NOT_FOUND', message);
export const conflict = (code: string, message: string, details?: FieldError[]) => new AppError(409, code, message, details);
export const fieldError = (status: number, code: string, field: string, message: string) =>
  new AppError(status, code, message, [{ field, message }]);
