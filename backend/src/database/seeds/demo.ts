import { hash } from '@node-rs/argon2';

import { loadDotEnv } from '../../config/config';
import dataSource from '../data-source';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { EntityManager } from 'typeorm';

import {
  type AgeCategory,
  Category,
  Consent,
  type ConsentType,
  Contributor,
  Entry,
  type EntryStatus,
  Member,
  MembershipRequest,
  Payment,
  type PaymentMethod,
  type Role,
  User,
} from '../entities';

/**
 * Demo data matching the frontend mocks: the same accounts (password Motdepasse123!),
 * members and membership requests. Refused in production; does nothing if already loaded.
 */
const PASSWORD = 'Motdepasse123!';
const CATEGORIES: AgeCategory[] = ['50_64', '65_74', '75_84', '85_PLUS'];
const FIRST = [
  'Lucie',
  'André',
  'Monique',
  'Gilles',
  'Francine',
  'Normand',
  'Huguette',
  'Réjean',
  'Denise',
  'Yvon',
  'Ginette',
  'Serge',
];
const LAST = [
  'Gauthier',
  'Morin',
  'Lefebvre',
  'Pelletier',
  'Bélanger',
  'Lévesque',
  'Bergeron',
  'Leblanc',
  'Paquette',
  'Girard',
  'Simard',
  'Boucher',
];
const ascii = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z]/g, '');
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

async function demo() {
  loadDotEnv();
  if (process.env.NODE_ENV === 'production') throw new Error('The demo seed never runs in production.');
  await dataSource.initialize();
  await dataSource.runMigrations();
  if (await dataSource.getRepository(User).existsBy({ email: 'admin@lesaines.test' })) {
    console.log('Demo accounts already loaded.');
    if (!(await dataSource.getRepository(Entry).count())) await dataSource.transaction(finance);
    return dataSource.destroy();
  }

  await dataSource.transaction(async (manager) => {
    const passwordHash = await hash(PASSWORD);
    const members = manager.getRepository(Member);
    const consents = manager.getRepository(Consent);
    const grant = (memberId: string, types: ConsentType[], days: number) =>
      types.length
        ? consents.insert(types.map((type) => ({ memberId, type, grantedAt: daysAgo(days) })))
        : undefined;

    const robert = await members.save(
      members.create({
        firstName: 'Robert',
        lastName: 'Lavoie',
        email: 'membre@lesaines.test',
        phone: '514 555-0142',
        address: '123, rue Exemple\nMontréal (Québec)',
        sex: 'MALE',
        ageCategory: '75_84',
        birthDate: '1948-03-12',
      }),
    );
    await grant(robert.id, ['BIRTHDAY_WISHES', 'TESTIMONIAL_PUBLICATION'], 60);
    const paul = await members.save(
      members.create({
        firstName: 'Paul',
        lastName: 'Côté',
        email: 'bloque@lesaines.test',
        sex: 'MALE',
        ageCategory: '85_PLUS',
      }),
    );

    for (const [i, firstName] of FIRST.entries()) {
      const m = await members.save(
        members.create({
          firstName,
          lastName: LAST[i],
          email: `${ascii(firstName)}.${ascii(LAST[i])}@exemple.org`,
          phone: i % 3 === 0 ? null : `514 555-${1000 + i * 37}`,
          // FIRST alternates women's and men's first names.
          sex: i % 2 === 0 ? 'FEMALE' : 'MALE',
          ageCategory: CATEGORIES[i % 4],
          birthDate: i % 2 === 0 ? `19${45 + i}-0${(i % 9) + 1}-1${i % 9}` : null,
          active: i !== 5,
        }),
      );
      await grant(
        m.id,
        [
          ...(i % 2 === 0 ? (['BIRTHDAY_WISHES'] as const) : []),
          ...(i % 3 === 0 ? (['NEWSLETTER'] as const) : []),
        ],
        30 + i * 11,
      );
    }

    const users = manager.getRepository(User);
    const account = (
      email: string,
      firstName: string,
      lastName: string,
      roles: Role[],
      extra: Partial<User> = {},
    ) =>
      users.save(
        users.create({
          email,
          firstName,
          lastName,
          passwordHash,
          userRoles: roles.map((role) => ({ role })),
          ...extra,
        }),
      );
    const admin = await account('admin@lesaines.test', 'Aminata', 'Diallo', ['ADMIN']);
    await account('finance@lesaines.test', 'Marc', 'Tremblay', ['FINANCE']);
    await account('temoignages@lesaines.test', 'Julie', 'Gagnon', ['TESTIMONIALS']);
    await account('membre@lesaines.test', 'Robert', 'Lavoie', ['MEMBER'], { memberId: robert.id });
    await account('direction@lesaines.test', 'Claire', 'Bouchard', ['ADMIN', 'FINANCE']);
    // Locked, to show the locked-account message.
    await account('bloque@lesaines.test', 'Paul', 'Côté', ['MEMBER'], {
      memberId: paul.id,
      failedAttempts: 5,
      lockedUntil: new Date('2099-01-01'),
    });

    const requests = manager.getRepository(MembershipRequest);
    const request = (
      firstName: string,
      lastName: string,
      days: number,
      extra: Partial<MembershipRequest> = {},
    ) =>
      requests.save(
        requests.create({
          firstName,
          lastName,
          email: `${ascii(firstName)}.${ascii(lastName)}@exemple.org`,
          phone: '514 555-0199',
          sex: 'FEMALE',
          ageCategory: '65_74',
          birthdayWishesConsent: true,
          submittedAt: daysAgo(days),
          ...extra,
        }),
      );
    await request('Hélène', 'Fortin', 1);
    await request('Jacques', 'Ouellet', 3, { newsletterConsent: true, sex: 'MALE', ageCategory: '75_84' });
    await request('Pierrette', 'Gagné', 6);
    await request('Michel', 'Roy', 9, { sex: 'MALE', ageCategory: '50_64' });
    await request('Thérèse', 'Martin', 20, {
      status: 'REJECTED',
      decidedAt: daysAgo(19),
      decidedById: admin.id,
      rejectionReason: 'Adresse hors du territoire desservi.',
    });
    await finance(manager);
  });
  console.log(
    `Demo data loaded. Accounts: admin@, finance@, temoignages@, membre@, direction@, bloque@lesaines.test — password ${PASSWORD}`,
  );
  await dataSource.destroy();
}

/** Sprint 2: contributors and books in every state (validated, draft, to approve, reversed, online gift). */
async function finance(manager: EntityManager) {
  const byEmail = async (email: string) => manager.getRepository(User).findOneByOrFail({ email });
  const [marc, claire] = [await byEmail('finance@lesaines.test'), await byEmail('direction@lesaines.test')];
  const robert = await manager.getRepository(Member).findOneByOrFail({ email: 'membre@lesaines.test' });
  const cat = async (name: string, direction: 'INCOME' | 'EXPENSE') =>
    (await manager.getRepository(Category).findOneByOrFail({ name, direction })).id;

  const people = manager.getRepository(Contributor);
  const contributor = (data: Partial<Contributor>) => people.save(people.create(data));
  const lavoie = await contributor({
    name: 'Robert Lavoie',
    email: 'membre@lesaines.test',
    memberId: robert.id,
  });
  const caisse = await contributor({
    kind: 'ORGANIZATION',
    name: 'Caisse populaire du quartier',
    email: 'dons@caisse.example',
    phone: '514 555-0400',
  });
  const ville = await contributor({ kind: 'ORGANIZATION', name: 'Ville de Montréal — arrondissement' });
  const gingras = await contributor({ name: 'Paulette Gingras', email: 'paulette.gingras@exemple.org' });
  const morin = await contributor({
    name: 'Gérard Morin',
    email: 'gerard.morin@exemple.org',
    phone: '514 555-1037',
  });

  const day = (days: number) =>
    new Date(Date.now() - days * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
  const entries = manager.getRepository(Entry);
  const storage = process.env.STORAGE_LOCAL_DIR ?? '.storage';
  type Seed = {
    direction: 'INCOME' | 'EXPENSE';
    amountCents: number;
    categoryName: string;
    days: number;
    status: EntryStatus;
    method: PaymentMethod;
    description: string;
  } & Partial<Entry>;
  const entry = async ({
    direction,
    amountCents,
    categoryName,
    days,
    status,
    method,
    description,
    ...rest
  }: Seed) => {
    const saved = await entries.save(
      entries.create({
        direction,
        amountCents,
        categoryId: await cat(categoryName, direction),
        entryDate: day(days),
        paymentMethod: method,
        description,
        createdById: marc.id,
        ...rest,
        status: status === 'VALIDATED' ? 'DRAFT' : status,
      }),
    );
    if (direction === 'EXPENSE' && status !== 'DRAFT') {
      // A receipt is required to validate an expense: a small demo PDF in local storage.
      const key = `entries/${saved.id}/facture-demo.pdf`;
      await mkdir(dirname(join(storage, key)), { recursive: true });
      await writeFile(join(storage, key), '%PDF-1.4\n% Facture de démonstration\n%%EOF\n');
      await writeFile(join(storage, `${key}.type`), 'application/pdf');
      await entries.update(saved.id, {
        attachmentKey: key,
        attachmentName: 'facture-demo.pdf',
        attachmentType: 'application/pdf',
        attachmentSize: 40,
      });
    }
    if (status === 'VALIDATED')
      await entries.update(saved.id, {
        status: 'VALIDATED',
        validatedById: marc.id,
        validatedAt: new Date(),
      });
    return entries.findOneByOrFail({ id: saved.id });
  };

  await entry({
    direction: 'INCOME',
    amountCents: 250_000,
    categoryName: 'Subventions',
    days: 40,
    status: 'VALIDATED',
    method: 'TRANSFER',
    description: 'Subvention de fonctionnement',
    contributorId: ville.id,
  });
  await entry({
    direction: 'INCOME',
    amountCents: 2_500,
    categoryName: 'Cotisations des membres',
    days: 9,
    status: 'VALIDATED',
    method: 'CASH',
    description: 'Cotisation annuelle',
    contributorId: lavoie.id,
  });
  await entry({
    direction: 'INCOME',
    amountCents: 50_000,
    categoryName: 'Dons',
    days: 6,
    status: 'VALIDATED',
    method: 'CHEQUE',
    description: 'Don de fin d’année',
    contributorId: caisse.id,
    project: 'Fête de Noël',
  });
  await entry({
    direction: 'INCOME',
    amountCents: 1_200,
    categoryName: 'Activités et sorties',
    days: 2,
    status: 'DRAFT',
    method: 'CASH',
    description: 'Billets — sortie au musée',
    project: 'Sorties',
  });
  await entry({
    direction: 'EXPENSE',
    amountCents: 120_000,
    categoryName: 'Loyer et charges',
    days: 30,
    status: 'APPROVED',
    method: 'TRANSFER',
    supplier: 'Gestion Immobilière Centre-Sud',
    description: 'Loyer de novembre',
    decidedById: claire.id,
    decidedAt: new Date(),
  }).then((e) =>
    entries.update(e.id, { status: 'VALIDATED', validatedById: marc.id, validatedAt: new Date() }),
  );
  await entry({
    direction: 'EXPENSE',
    amountCents: 8_745,
    categoryName: 'Fournitures de bureau',
    days: 8,
    status: 'VALIDATED',
    method: 'CARD',
    supplier: 'Bureau en Gros',
    description: 'Papier et cartouches',
  });
  await entry({
    direction: 'EXPENSE',
    amountCents: 64_000,
    categoryName: 'Activités et sorties',
    days: 4,
    status: 'SUBMITTED',
    method: 'CHEQUE',
    supplier: 'Autobus Laval',
    description: 'Autobus — sortie au Biodôme',
    project: 'Sorties',
  });
  await entry({
    direction: 'EXPENSE',
    amountCents: 75_500,
    categoryName: 'Communication et impression',
    days: 3,
    status: 'SUBMITTED',
    method: 'CARD',
    supplier: 'Imprimerie du Plateau',
    description: 'Dépliants du 25e anniversaire',
    createdById: claire.id,
  });
  await entry({
    direction: 'EXPENSE',
    amountCents: 1_850,
    categoryName: 'Frais bancaires',
    days: 1,
    status: 'DRAFT',
    method: 'OTHER',
    supplier: 'Desjardins',
    description: 'Frais de tenue de compte',
  });

  // A validated entry corrected by its reversal.
  const refused = await entry({
    direction: 'INCOME',
    amountCents: 3_000,
    categoryName: 'Cotisations des membres',
    days: 15,
    status: 'VALIDATED',
    method: 'CHEQUE',
    description: 'Cotisation (chèque refusé)',
    contributorId: morin.id,
  });
  await entries.save(
    entries.create({
      direction: 'INCOME',
      status: 'VALIDATED',
      amountCents: -3_000,
      categoryId: refused.categoryId,
      entryDate: day(14),
      paymentMethod: 'CHEQUE',
      description: `Contrepassation de ${refused.reference}`,
      contributorId: morin.id,
      reversesId: refused.id,
      reversalReason: 'Chèque sans provision',
      createdById: marc.id,
      validatedById: marc.id,
      validatedAt: new Date(),
    }),
  );

  // An online gift, as the Stripe webhook records it.
  const gift = await entries.save(
    entries.create({
      direction: 'INCOME',
      status: 'VALIDATED',
      amountCents: 5_000,
      categoryId: await cat('Dons', 'INCOME'),
      entryDate: day(12),
      paymentMethod: 'ONLINE',
      source: 'ONLINE',
      description: 'Don en ligne — Paulette Gingras',
      contributorId: gingras.id,
      validatedAt: new Date(),
    }),
  );
  const payments = manager.getRepository(Payment);
  await payments.save(
    payments.create({
      provider: 'FAKE',
      status: 'CONFIRMED',
      amountCents: 5_000,
      donorName: 'Paulette Gingras',
      donorEmail: 'paulette.gingras@exemple.org',
      checkoutSessionId: 'cs_demo_gingras',
      paymentIntentId: 'pi_demo_gingras',
      contributorId: gingras.id,
      entryId: gift.id,
      confirmedAt: new Date(),
    }),
  );
}

demo().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
