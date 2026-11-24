import { hash } from '@node-rs/argon2';
import type { DataSource } from 'typeorm';

import { type Role, User } from '../../src/database/entities';

export const TEST_PASSWORD = 'Motdepasse123!';
let sequence = 0;

/** Creates a user directly in the database; unique e-mail on every call. */
export async function createUser(
  dataSource: DataSource,
  overrides: Partial<Pick<User, 'email' | 'firstName' | 'lastName' | 'active' | 'memberId' | 'lockedUntil'>> & {
    roles?: Role[];
    password?: string | null;
  } = {},
): Promise<User> {
  sequence += 1;
  const { roles = ['ADMIN'], password = TEST_PASSWORD, ...fields } = overrides;
  const repo = dataSource.getRepository(User);
  return repo.save(
    repo.create({
      email: `user${sequence}.${Date.now()}@test.local`,
      firstName: 'Test',
      lastName: `Utilisateur ${sequence}`,
      passwordHash: password ? await hash(password) : null,
      userRoles: roles.map((role) => ({ role })),
      ...fields,
    }),
  );
}
