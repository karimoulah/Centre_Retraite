import { hash } from '@node-rs/argon2';

import dataSource from '../data-source';
import { User, UserRole } from '../entities';

/**
 * Reference seed, safe in every environment: creates the first administrator from
 * SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD when no administrator exists yet.
 */
async function seed() {
  await dataSource.initialize();
  await dataSource.runMigrations();
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const admins = await dataSource.getRepository(UserRole).countBy({ role: 'ADMIN' });
  if (admins > 0) {
    console.log('An administrator already exists: nothing to do.');
  } else if (!email || !password) {
    console.log('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create the first administrator.');
  } else {
    const user = dataSource.getRepository(User).create({
      email,
      firstName: 'Administration',
      lastName: 'Centre',
      passwordHash: await hash(password),
      userRoles: [{ role: 'ADMIN' }],
    });
    await dataSource.getRepository(User).save(user);
    console.log(`Administrator ${email} created.`);
  }
  await dataSource.destroy();
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
