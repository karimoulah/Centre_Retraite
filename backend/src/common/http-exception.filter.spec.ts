import { ForbiddenException } from '@nestjs/common';
import { createZodDto, ZodValidationPipe } from 'nestjs-zod';
import { QueryFailedError } from 'typeorm';

import { AppError } from './app-error';
import { toErrorResponse } from './http-exception.filter';
import { z } from './zod';

const queryError = (driverError: Record<string, unknown>) =>
  new QueryFailedError('INSERT', [], Object.assign(new Error('db'), driverError));

describe('toErrorResponse', () => {
  it('keeps business errors as they are', () => {
    const { status, body } = toErrorResponse(new AppError(409, 'EMAIL_TAKEN', 'Pris.', [{ field: 'email', message: 'Pris.' }]));
    expect(status).toBe(409);
    expect(body).toEqual({ code: 'EMAIL_TAKEN', message: 'Pris.', details: [{ field: 'email', message: 'Pris.' }] });
  });

  it('gives a French message to framework errors', () => {
    expect(toErrorResponse(new ForbiddenException()).body).toEqual({
      code: 'FORBIDDEN',
      message: "Vous n'avez pas accès à cette ressource.",
    });
  });

  it('turns zod failures into 422 with one entry per field', () => {
    class Dto extends createZodDto(z.object({ email: z.email(), age: z.number() })) {}
    let error: unknown;
    try {
      new ZodValidationPipe().transform({ email: 'x' }, { type: 'body', metatype: Dto });
    } catch (e) {
      error = e;
    }
    const { status, body } = toErrorResponse(error);
    expect(status).toBe(422);
    expect(body.code).toBe('VALIDATION_FAILED');
    expect((body.details as { field: string }[]).map((d) => d.field).sort()).toEqual(['age', 'email']);
  });

  it('turns a unique index violation into a readable 409', () => {
    const { status, body } = toErrorResponse(queryError({ code: '23505', constraint: 'users_email_key' }));
    expect(status).toBe(409);
    expect(body.code).toBe('EMAIL_TAKEN');
  });

  it('turns the "already decided" trigger into a 409', () => {
    expect(toErrorResponse(queryError({ code: 'P0409' })).body.code).toBe('ALREADY_DECIDED');
  });

  it('hides unexpected errors behind a generic 500', () => {
    expect(toErrorResponse(new Error('boom'))).toEqual({
      status: 500,
      body: { code: 'INTERNAL_ERROR', message: 'Une erreur inattendue est survenue.' },
    });
  });
});
