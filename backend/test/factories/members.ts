import type { DataSource } from 'typeorm';

import { Consent, type ConsentType, Member } from '../../src/database/entities';

let n = 0;
export async function createMember(ds: DataSource, overrides: Partial<Member> = {}, consents: ConsentType[] = []) {
  n += 1;
  const repo = ds.getRepository(Member);
  const member = await repo.save(
    repo.create({ firstName: 'Jeanne', lastName: `Lavoie${n}`, email: `jeanne.${n}.${Date.now()}@exemple.ca`, ageCategory: '75_84', ...overrides }),
  );
  if (consents.length) await ds.getRepository(Consent).insert(consents.map((type) => ({ memberId: member.id, type, grantedAt: new Date() })));
  return repo.findOneOrFail({ where: { id: member.id }, relations: { consents: true } });
}
