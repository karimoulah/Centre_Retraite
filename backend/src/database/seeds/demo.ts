import { hash } from '@node-rs/argon2';

import { loadDotEnv } from '../../config/config';
import dataSource from '../data-source';
import { type AgeCategory, Consent, type ConsentType, Member, MembershipRequest, type Role, User } from '../entities';

/**
 * Demo data matching the frontend mocks: the same accounts (password Motdepasse123!),
 * members and membership requests. Refused in production; does nothing if already loaded.
 */
const PASSWORD = 'Motdepasse123!';
const CATEGORIES: AgeCategory[] = ['50_64', '65_74', '75_84', '85_PLUS'];
const FIRST = ['Lucie', 'André', 'Monique', 'Gilles', 'Francine', 'Normand', 'Huguette', 'Réjean', 'Denise', 'Yvon', 'Ginette', 'Serge'];
const LAST = ['Gauthier', 'Morin', 'Lefebvre', 'Pelletier', 'Bélanger', 'Lévesque', 'Bergeron', 'Leblanc', 'Paquette', 'Girard', 'Simard', 'Boucher'];
const ascii = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

async function demo() {
  loadDotEnv();
  if (process.env.NODE_ENV === 'production') throw new Error('The demo seed never runs in production.');
  await dataSource.initialize();
  await dataSource.runMigrations();
  if (await dataSource.getRepository(User).existsBy({ email: 'admin@lesaines.test' })) {
    console.log('Demo data already loaded: nothing to do.');
    return dataSource.destroy();
  }

  await dataSource.transaction(async (manager) => {
    const passwordHash = await hash(PASSWORD);
    const members = manager.getRepository(Member);
    const consents = manager.getRepository(Consent);
    const grant = (memberId: string, types: ConsentType[], days: number) =>
      types.length ? consents.insert(types.map((type) => ({ memberId, type, grantedAt: daysAgo(days) }))) : undefined;

    const robert = await members.save(
      members.create({
        firstName: 'Robert',
        lastName: 'Lavoie',
        email: 'membre@lesaines.test',
        phone: '514 555-0142',
        address: '123, rue Exemple\nMontréal (Québec)',
        ageCategory: '75_84',
        birthDate: '1948-03-12',
      }),
    );
    await grant(robert.id, ['BIRTHDAY_WISHES', 'TESTIMONIAL_PUBLICATION'], 60);
    const paul = await members.save(members.create({ firstName: 'Paul', lastName: 'Côté', email: 'bloque@lesaines.test', ageCategory: '85_PLUS' }));

    for (const [i, firstName] of FIRST.entries()) {
      const m = await members.save(
        members.create({
          firstName,
          lastName: LAST[i],
          email: `${ascii(firstName)}.${ascii(LAST[i])}@exemple.org`,
          phone: i % 3 === 0 ? null : `514 555-${1000 + i * 37}`,
          ageCategory: CATEGORIES[i % 4],
          birthDate: i % 2 === 0 ? `19${45 + i}-0${(i % 9) + 1}-1${i % 9}` : null,
          active: i !== 5,
        }),
      );
      await grant(m.id, [...(i % 2 === 0 ? (['BIRTHDAY_WISHES'] as const) : []), ...(i % 3 === 0 ? (['NEWSLETTER'] as const) : [])], 30 + i * 11);
    }

    const users = manager.getRepository(User);
    const account = (email: string, firstName: string, lastName: string, roles: Role[], extra: Partial<User> = {}) =>
      users.save(users.create({ email, firstName, lastName, passwordHash, userRoles: roles.map((role) => ({ role })), ...extra }));
    const admin = await account('admin@lesaines.test', 'Aminata', 'Diallo', ['ADMIN']);
    await account('finance@lesaines.test', 'Marc', 'Tremblay', ['FINANCE']);
    await account('temoignages@lesaines.test', 'Julie', 'Gagnon', ['TESTIMONIALS']);
    await account('membre@lesaines.test', 'Robert', 'Lavoie', ['MEMBER'], { memberId: robert.id });
    await account('direction@lesaines.test', 'Claire', 'Bouchard', ['ADMIN', 'FINANCE']);
    // Locked, to show the locked-account message.
    await account('bloque@lesaines.test', 'Paul', 'Côté', ['MEMBER'], { memberId: paul.id, failedAttempts: 5, lockedUntil: new Date('2099-01-01') });

    const requests = manager.getRepository(MembershipRequest);
    const request = (firstName: string, lastName: string, days: number, extra: Partial<MembershipRequest> = {}) =>
      requests.save(
        requests.create({
          firstName,
          lastName,
          email: `${ascii(firstName)}.${ascii(lastName)}@exemple.org`,
          phone: '514 555-0199',
          ageCategory: '65_74',
          birthdayWishesConsent: true,
          submittedAt: daysAgo(days),
          ...extra,
        }),
      );
    await request('Hélène', 'Fortin', 1);
    await request('Jacques', 'Ouellet', 3, { newsletterConsent: true, ageCategory: '75_84' });
    await request('Pierrette', 'Gagné', 6);
    await request('Michel', 'Roy', 9, { ageCategory: '50_64' });
    await request('Thérèse', 'Martin', 20, { status: 'REJECTED', decidedAt: daysAgo(19), decidedById: admin.id, rejectionReason: 'Adresse hors du territoire desservi.' });
  });
  console.log(`Demo data loaded. Accounts: admin@, finance@, temoignages@, membre@, direction@, bloque@lesaines.test — password ${PASSWORD}`);
  await dataSource.destroy();
}

demo().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
