import { Injectable } from '@nestjs/common';

import { conflict, notFound } from '../../common/app-error';
import { paginate } from '../../common/pagination';
import { Tx } from '../../common/transaction/transaction.service';
import { type Role, Session, User, UserRole } from '../../database/entities';
import { AuditService } from '../audit/audit.service';
import { PasswordService } from '../auth/password.service';
import { NotificationsService } from '../notifications/notifications.service';
import { fullName } from './user.mapper';
import type { CreateUserDto, ListUsersQuery, UpdateUserDto } from './users.schemas';

/** GET /users, GET /users/:id */
export const toAccount = (u: User) => ({
  id: u.id,
  email: u.email,
  firstName: u.firstName,
  lastName: u.lastName,
  name: `${u.lastName} ${u.firstName}`,
  roles: u.roles,
  memberId: u.memberId,
  active: u.active,
  invitationPending: u.invitationPending,
  createdAt: u.createdAt.toISOString(),
  lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
});

@Injectable()
export class UsersService {
  constructor(
    private readonly tx: Tx,
    private readonly audit: AuditService,
    private readonly passwords: PasswordService,
    private readonly notifications: NotificationsService,
  ) {}

  list(query: ListUsersQuery) {
    const qb = this.tx.repo(User).createQueryBuilder('u').leftJoinAndSelect('u.userRoles', 'r');
    if (query.role) qb.andWhere('u.id IN (SELECT user_id FROM app.user_roles WHERE role = :role)', { role: query.role });
    if (query.status === 'active') qb.andWhere('u.active');
    if (query.status === 'inactive') qb.andWhere('NOT u.active');
    if (query.status === 'pending') qb.andWhere('u.password_hash IS NULL AND u.active');
    return paginate(
      qb,
      query,
      {
        sortable: { name: 'u.lastName', email: 'u.email', createdAt: 'u.createdAt', lastLoginAt: 'u.lastLoginAt' },
        defaultSort: { key: 'name', order: 'asc' },
        search: ['u.email', 'u.firstName', 'u.lastName'],
      },
      toAccount,
    );
  }

  async get(id: string) {
    return toAccount(await this.find(id));
  }

  /** Creates the account without a password and e-mails an invitation link (valid 72 hours). */
  async create(dto: CreateUserDto) {
    const taken = await this.tx.repo(User).createQueryBuilder('u').where('lower(u.email) = :email', { email: dto.email }).getExists();
    if (taken) throw conflict('EMAIL_TAKEN', 'Un compte existe déjà avec ce courriel.', [{ field: 'email', message: 'Un compte existe déjà avec ce courriel.' }]);
    const repo = this.tx.repo(User);
    const saved = await repo.save(
      repo.create({ email: dto.email, firstName: dto.firstName, lastName: dto.lastName, userRoles: dto.roles.map((role) => ({ role })) }),
    );
    const user = await this.find(saved.id);
    const link = await this.passwords.createLink(user, 'INVITATION');
    await this.notifications.schedule('USER_INVITATION', user.email, { firstName: user.firstName, url: link.url }, `invite:${link.id}`);
    await this.audit.record({ action: 'USER_CREATED', entityType: 'User', entityId: user.id, entityLabel: fullName(user), after: { email: user.email, roles: user.roles } });
    return toAccount(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.find(id);
    const before = { firstName: user.firstName, lastName: user.lastName };
    await this.tx.repo(User).update(id, dto);
    const updated = await this.find(id);
    await this.audit.record({ action: 'USER_UPDATED', entityType: 'User', entityId: id, entityLabel: fullName(updated), before, after: { ...dto } });
    return toAccount(updated);
  }

  /** Replaces the role list; an administrator cannot remove their own ADMIN role. */
  async setRoles(id: string, roles: Role[], actor: User) {
    const user = await this.find(id);
    if (user.id === actor.id && user.roles.includes('ADMIN') && !roles.includes('ADMIN')) {
      throw conflict('CANNOT_REMOVE_OWN_ADMIN', 'Vous ne pouvez pas retirer votre propre rôle Administration.');
    }
    const before = { roles: user.roles };
    await this.tx.repo(UserRole).delete({ userId: id });
    await this.tx.repo(UserRole).insert(roles.map((role) => ({ userId: id, role })));
    const updated = await this.find(id);
    await this.audit.record({ action: 'USER_ROLES_CHANGED', entityType: 'User', entityId: id, entityLabel: fullName(updated), before, after: { roles: updated.roles } });
    return toAccount(updated);
  }

  /** No deletion: the account is deactivated and its sessions end immediately. */
  async deactivate(id: string, actor: User) {
    const user = await this.find(id);
    if (user.id === actor.id) throw conflict('CANNOT_DEACTIVATE_SELF', 'Vous ne pouvez pas désactiver votre propre compte.');
    if (!user.active) throw conflict('ALREADY_INACTIVE', 'Ce compte est déjà désactivé.');
    await this.tx.repo(User).update(id, { active: false });
    await this.tx.repo(Session).createQueryBuilder().update().set({ revokedAt: () => 'now()' }).where('user_id = :id AND revoked_at IS NULL', { id }).execute();
    await this.audit.record({ action: 'USER_DEACTIVATED', entityType: 'User', entityId: id, entityLabel: fullName(user), before: { active: true }, after: { active: false } });
    return toAccount(await this.find(id));
  }

  private async find(id: string): Promise<User> {
    const user = await this.tx.repo(User).findOneBy({ id });
    if (!user) throw notFound('Utilisateur introuvable.');
    return user;
  }
}

