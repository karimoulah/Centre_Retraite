import type { NextFunction, Request, Response } from 'express';

import { toErrorResponse } from '../http-exception.filter';
import { AppError } from '../app-error';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF guard for cookie sessions: a browser always sends Origin on a cross-site write,
 * so a write whose Origin is not the frontend is refused. Calls without Origin
 * (Next.js server, curl, tests) carry no ambient browser cookies and are let through.
 */
export function originCheck(allowed: string[]) {
  const origins = new Set(allowed.map((url) => new URL(url).origin));
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (SAFE.has(req.method) || !origin || origins.has(origin)) return next();
    const { status, body } = toErrorResponse(new AppError(403, 'FORBIDDEN_ORIGIN', 'Requête refusée : origine non autorisée.'));
    res.status(status).json(body);
  };
}
