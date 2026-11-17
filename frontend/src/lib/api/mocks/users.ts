import type { CreateUserRequest, Role, UpdateRolesRequest, UpdateUserRequest, UserAccount } from '../contracts';
import { actorOf, guard, isResponse, MOCK_PASSWORD, mockUsers, type MockUser } from './auth';
import { recordAudit } from './audit';
import { created, fail, ok, paginate, type MockRoute } from './types';

const toAccount = ({ password: _p, failedAttempts: _f, ...account }: MockUser): UserAccount => account;
const label = (u: MockUser) => `${u.firstName} ${u.lastName}`;

export const userRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/users',
    handler: (request) => {
      const me = guard(request, 'ADMIN');
      if (isResponse(me)) return me;
      const role = request.query.get('role');
      const status = request.query.get('status');
      const items = mockUsers()
        .filter((u) => !role || u.roles.includes(role as Role))
        .filter((u) => !status || (status === 'active' ? u.active : status === 'inactive' ? !u.active : u.invitationPending))
        .map((u) => ({ ...toAccount(u), name: `${u.lastName} ${u.firstName}` }));
      return ok(paginate(items, request.query, ['email', 'firstName', 'lastName']));
    },
  },
  {
    method: 'POST',
    path: '/users',
    handler: (request) => {
      const me = guard(request, 'ADMIN');
      if (isResponse(me)) return me;
      const body = request.body as CreateUserRequest;
      if (mockUsers().some((u) => u.email.toLowerCase() === body.email.toLowerCase())) {
        return fail(409, 'EMAIL_TAKEN', 'Un compte existe déjà avec ce courriel.', [{ field: 'email', message: 'Un compte existe déjà avec ce courriel.' }]);
      }
      const account: MockUser = {
        id: `u-${Date.now()}`,
        ...body,
        password: MOCK_PASSWORD,
        active: true,
        invitationPending: true,
        failedAttempts: 0,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
      };
      mockUsers().push(account);
      recordAudit({ actor: actorOf(me), action: 'USER_CREATED', entityType: 'User', entityId: account.id, entityLabel: label(account), after: { email: account.email, roles: account.roles } });
      return created(toAccount(account));
    },
  },
  {
    method: 'GET',
    path: '/users/:id',
    handler: (request) => {
      const me = guard(request, 'ADMIN');
      if (isResponse(me)) return me;
      const account = mockUsers().find((u) => u.id === request.params.id);
      return account ? ok(toAccount(account)) : fail(404, 'NOT_FOUND', 'Utilisateur introuvable.');
    },
  },
  {
    method: 'PATCH',
    path: '/users/:id',
    handler: (request) => {
      const me = guard(request, 'ADMIN');
      if (isResponse(me)) return me;
      const account = mockUsers().find((u) => u.id === request.params.id);
      if (!account) return fail(404, 'NOT_FOUND', 'Utilisateur introuvable.');
      const body = request.body as UpdateUserRequest;
      const before = { firstName: account.firstName, lastName: account.lastName };
      Object.assign(account, body);
      recordAudit({ actor: actorOf(me), action: 'USER_UPDATED', entityType: 'User', entityId: account.id, entityLabel: label(account), before, after: { ...body } });
      return ok(toAccount(account));
    },
  },
  {
    method: 'PUT',
    path: '/users/:id/roles',
    handler: (request) => {
      const me = guard(request, 'ADMIN');
      if (isResponse(me)) return me;
      const account = mockUsers().find((u) => u.id === request.params.id);
      if (!account) return fail(404, 'NOT_FOUND', 'Utilisateur introuvable.');
      const { roles } = request.body as UpdateRolesRequest;
      if (roles.length === 0) return fail(422, 'VALIDATION_FAILED', 'Choisissez au moins un rôle.', [{ field: 'roles', message: 'Choisissez au moins un rôle.' }]);
      if (account.id === me.id && !roles.includes('ADMIN')) {
        return fail(409, 'CANNOT_REMOVE_OWN_ADMIN', 'Vous ne pouvez pas retirer votre propre rôle Administration.');
      }
      const before = { roles: account.roles };
      account.roles = roles;
      recordAudit({ actor: actorOf(me), action: 'USER_ROLES_CHANGED', entityType: 'User', entityId: account.id, entityLabel: label(account), before, after: { roles } });
      return ok(toAccount(account));
    },
  },
  {
    method: 'POST',
    path: '/users/:id/deactivate',
    handler: (request) => {
      const me = guard(request, 'ADMIN');
      if (isResponse(me)) return me;
      const account = mockUsers().find((u) => u.id === request.params.id);
      if (!account) return fail(404, 'NOT_FOUND', 'Utilisateur introuvable.');
      if (account.id === me.id) return fail(409, 'CANNOT_DEACTIVATE_SELF', 'Vous ne pouvez pas désactiver votre propre compte.');
      if (!account.active) return fail(409, 'ALREADY_INACTIVE', 'Ce compte est déjà désactivé.');
      account.active = false;
      recordAudit({ actor: actorOf(me), action: 'USER_DEACTIVATED', entityType: 'User', entityId: account.id, entityLabel: label(account), before: { active: true }, after: { active: false } });
      return ok(toAccount(account));
    },
  },
];
