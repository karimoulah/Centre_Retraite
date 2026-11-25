import type { DataSource } from 'typeorm';

import { MembershipRequest } from '../../src/database/entities';

let n = 0;
/** A request inserted directly (no e-mail, no audit), PENDING by default. */
export async function createMembershipRequest(ds: DataSource, overrides: Partial<MembershipRequest> = {}) {
  n += 1;
  const repo = ds.getRepository(MembershipRequest);
  return repo.save(
    repo.create({
      firstName: 'Paul',
      lastName: `Tremblay${n}`,
      email: `paul.${n}.${Date.now()}@exemple.ca`,
      sex: 'MALE',
      ageCategory: '65_74',
      ...overrides,
    }),
  );
}
