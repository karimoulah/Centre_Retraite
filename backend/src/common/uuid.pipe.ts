import { ParseUUIDPipe } from '@nestjs/common';

import { AppError } from './app-error';

/** :id must be a UUID; anything else is simply "not found". */
export const UuidParam = new ParseUUIDPipe({ exceptionFactory: () => new AppError(404, 'NOT_FOUND', 'Élément introuvable.') });
