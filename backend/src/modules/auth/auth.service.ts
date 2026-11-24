import { Injectable } from '@nestjs/common';
import { verify } from '@node-rs/argon2';
import type { Response } from 'express';
import { DataSource } from 'typeorm';

import { AppError } from '../../common/app-error';
import { Tx } from '../../common/transaction/transaction.service';
import { User } from '../../database/entities';
import { AuditService } from '../audit/audit.service';
import { fullName, toSessionUser, type SessionUser } from '../users/user.mapper';
import { TokenService } from './token.service';

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

const invalidCredentials = () => new AppError(401, 'INVALID_CREDENTIALS', 'Courriel ou mot de passe incorrect.');

@Injectable()
export class AuthService {
  constructor(
    private readonly tx: Tx,
    private readonly dataSource: DataSource,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  /** Same message whether the e-mail is unknown or the password wrong; 5 failures lock the account for 15 minutes. */
  async login(email: string, password: string, res: Response): Promise<{ user: SessionUser }> {
    const user = await this.tx
      .repo(User)
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .leftJoinAndSelect('u.userRoles', 'r')
      .where('lower(u.email) = lower(:email)', { email })
      .getOne();

    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      throw new AppError(423, 'ACCOUNT_LOCKED', 'Compte bloqué après plusieurs tentatives. Réessayez dans 15 minutes.');
    }
    const valid = !!user?.active && !!user.passwordHash && (await verify(user.passwordHash, password).catch(() => false));
    if (!user || !valid) {
      if (user) await this.recordFailure(user);
      throw invalidCredentials();
    }

    user.failedAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    await this.tx.repo(User).update(user.id, { failedAttempts: 0, lockedUntil: null, lastLoginAt: user.lastLoginAt });
    await this.tokens.startSession(user, res);
    await this.audit.record({ action: 'LOGIN_SUCCEEDED', entityType: 'User', entityId: user.id, entityLabel: fullName(user) });
    return { user: toSessionUser(user) };
  }

  /**
   * Written outside the request transaction on purpose: the 401 rolls the request back,
   * but the failed attempt (and its audit line) must stay.
   */
  private async recordFailure(user: User): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const attempts = user.failedAttempts + 1;
      const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null;
      await manager.update(User, user.id, { failedAttempts: lockedUntil ? 0 : attempts, lockedUntil });
      await manager.query(
        `INSERT INTO app.audit_logs (action, entity_type, entity_id, entity_label, after) VALUES ($1, 'User', $2, $3, $4)`,
        [lockedUntil ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED', user.id, fullName(user), { failedAttempts: attempts }],
      );
    });
  }
}
