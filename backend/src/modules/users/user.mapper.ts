import type { Role, User } from '../../database/entities';

/** GET /auth/me */
export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  memberId: string | null;
};

export const toSessionUser = (user: User): SessionUser => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  roles: user.roles,
  memberId: user.memberId,
});

export const fullName = (person: { firstName: string; lastName: string }) => `${person.firstName} ${person.lastName}`;
