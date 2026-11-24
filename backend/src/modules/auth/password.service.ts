import { createHash, randomBytes } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import { hash } from '@node-rs/argon2';
import { IsNull } from 'typeorm';

import { AppError } from '../../common/app-error';
import { Tx } from '../../common/transaction/transaction.service';
import { ENV, type Env } from '../../config/config.module';
import { PasswordToken, Session, type TokenPurpose, User } from '../../database/entities';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { fullName } from '../users/user.mapper';

const TTL_HOURS: Record<TokenPurpose, number> = { RESET: 1, INVITATION: 72 };
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

/** Single-use links (reset and invitation). Only the hash of the token is stored. */
@Injectable()
export class PasswordService {
  constructor(
    private readonly tx: Tx,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /** Creates a link token and invalidates the previous unused ones of the same kind. */
  async createLink(user: User, purpose: TokenPurpose): Promise<{ id: string; url: string }> {
    const repo = this.tx.repo(PasswordToken);
    await repo.update({ userId: user.id, purpose, usedAt: IsNull() }, { expiresAt: new Date() });
    const token = randomBytes(32).toString('base64url');
    const saved = await repo.save(
      repo.create({
        userId: user.id,
        purpose,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + TTL_HOURS[purpose] * 3_600_000),
      }),
    );
    return { id: saved.id, url: `${this.env.WEB_URL}/reset-password?token=${token}` };
  }

  /** Always the same answer, whether the e-mail exists or not. */
  async forgot(email: string): Promise<{ sent: true }> {
    const user = await this.tx
      .repo(User)
      .createQueryBuilder('u')
      .where('lower(u.email) = lower(:email) AND u.active', { email })
      .getOne();
    if (user) {
      const link = await this.createLink(user, 'RESET');
      await this.notifications.schedule('PASSWORD_RESET', user.email, { firstName: user.firstName, url: link.url }, `reset:${link.id}`);
    }
    return { sent: true };
  }

  /** Sets the new password, consumes the token, unlocks the account and ends every open session. */
  async reset(token: string, password: string): Promise<{ reset: true }> {
    const found = await this.tx.repo(PasswordToken).findOneBy({ tokenHash: sha256(token) });
    if (!found || found.usedAt || found.expiresAt <= new Date()) {
      throw new AppError(410, 'TOKEN_EXPIRED', 'Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau.');
    }
    const user = await this.tx.repo(User).findOneByOrFail({ id: found.userId });
    await this.tx.repo(User).update(user.id, { passwordHash: await hash(password), failedAttempts: 0, lockedUntil: null });
    await this.tx.repo(PasswordToken).update(found.id, { usedAt: new Date() });
    await this.tx.repo(Session).update({ userId: user.id, revokedAt: IsNull() }, { revokedAt: new Date() });
    await this.audit.record({
      action: found.purpose === 'INVITATION' ? 'INVITATION_ACCEPTED' : 'PASSWORD_RESET',
      entityType: 'User',
      entityId: user.id,
      entityLabel: fullName(user),
    });
    return { reset: true };
  }
}
