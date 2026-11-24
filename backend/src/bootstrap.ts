import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { originCheck } from './common/security/origin.middleware';
import { ENV, type Env } from './config/config.module';

export const API_PREFIX = 'api/v1';

/** Shared by main.ts and the e2e tests, so tests run the exact production pipeline. */
export function configureApp(app: INestApplication): INestApplication {
  const env = app.get<Env>(ENV);

  app.setGlobalPrefix(API_PREFIX);
  // Every browser call goes through the Next.js server: per-IP limits must see the visitor's address, not the server's.
  (app as NestExpressApplication).set('trust proxy', env.TRUST_PROXY);
  app.use(helmet());
  app.use(cookieParser());
  // Only the frontend may call the API from a browser, with its session cookies.
  app.enableCors({ origin: [env.WEB_URL], credentials: true });
  app.use(originCheck([env.WEB_URL]));
  app.enableShutdownHooks();

  if (env.SWAGGER_ENABLED) {
    const config = new DocumentBuilder()
      .setTitle('lesaines API')
      .setDescription("API de la plateforme du Centre d'accompagnement des retraités")
      .setVersion('1.0')
      .addCookieAuth(env.AUTH_ACCESS_COOKIE)
      .build();
    const document = SwaggerModule.createDocument(app, config);
    // /api/docs (UI) and /api/docs-json (used by the frontend's `npm run api:types`).
    SwaggerModule.setup('api/docs', app, document, { jsonDocumentUrl: 'api/docs-json' });
  }
  return app;
}
