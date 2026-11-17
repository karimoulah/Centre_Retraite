import path from 'path';
import { fileURLToPath } from 'url';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import sharp from 'sharp';

import { Activities } from './collections/Activities';
import { Media } from './collections/Media';
import { Pages } from './collections/Pages';
import { FooterMenus } from './globals/FooterMenus';
import { MainMenu } from './globals/MainMenu';
import { SiteSettings } from './globals/SiteSettings';
import { Users } from './collections/Users';
import { migrations } from './migrations';
import { seed } from './seed';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [Pages, Activities, Media, Users],
  globals: [SiteSettings, MainMenu, FooterMenus],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  // Same database as the NestJS API, but Payload keeps its tables in its own schema.
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI ?? '' },
    schemaName: 'payload',
    // Development uses schema push; production and CI apply the committed migrations on startup.
    prodMigrations: migrations,
  }),
  sharp,
  onInit: async (payload) => {
    if (process.env.PAYLOAD_SEED !== 'false') await seed(payload);
  },
});
