import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions, Response } from 'express';

import { Tx } from '../../common/transaction/transaction.service';
import { ENV, type Env } from '../../config/config.module';
import { Session, type User } from '../../database/entities';

export type AccessPayload = { sub: string; typ: 'access' };
export type RefreshPayload = { sub: string; sid: string; typ: 'refresh' };

/** Issues the two httpOnly cookies of a session: a short access JWT and a refresh JWT tied to a revocable session row. */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly tx: Tx,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async startSession(user: User, res: Response): Promise<void> {
    const session = await this.tx.repo(Session).save(
      this.tx.repo(Session).create({
        userId: user.id,
        expiresAt: new Date(Date.now() + this.env.REFRESH_TOKEN_TTL_SECONDS * 1000),
      }),
    );
    const access = await this.jwt.signAsync({ sub: user.id, typ: 'access' } satisfies AccessPayload, {
      secret: this.env.JWT_ACCESS_SECRET,
      expiresIn: this.env.ACCESS_TOKEN_TTL_SECONDS,
    });
    const refresh = await this.jwt.signAsync({ sub: user.id, sid: session.id, typ: 'refresh' } satisfies RefreshPayload, {
      secret: this.env.JWT_REFRESH_SECRET,
      expiresIn: this.env.REFRESH_TOKEN_TTL_SECONDS,
    });
    res.cookie(this.env.AUTH_ACCESS_COOKIE, access, this.cookieOptions(this.env.ACCESS_TOKEN_TTL_SECONDS));
    res.cookie(this.env.AUTH_REFRESH_COOKIE, refresh, this.cookieOptions(this.env.REFRESH_TOKEN_TTL_SECONDS));
  }

  clearCookies(res: Response): void {
    res.clearCookie(this.env.AUTH_ACCESS_COOKIE, this.cookieOptions());
    res.clearCookie(this.env.AUTH_REFRESH_COOKIE, this.cookieOptions());
  }

  verifyAccess(token: string): Promise<AccessPayload> {
    return this.jwt.verifyAsync<AccessPayload>(token, { secret: this.env.JWT_ACCESS_SECRET });
  }

  verifyRefresh(token: string): Promise<RefreshPayload> {
    return this.jwt.verifyAsync<RefreshPayload>(token, { secret: this.env.JWT_REFRESH_SECRET });
  }

  /** httpOnly (unreadable by JavaScript), SameSite=Lax, Secure in production. */
  private cookieOptions(maxAgeSeconds?: number): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.env.COOKIE_SECURE,
      path: '/',
      ...(maxAgeSeconds ? { maxAge: maxAgeSeconds * 1000 } : {}),
    };
  }
}
