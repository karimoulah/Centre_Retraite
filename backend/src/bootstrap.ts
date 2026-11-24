import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { ENV, type Env } from './config/config.module';

export const API_PREFIX = 'api/v1';

/** Shared by main.ts and the e2e tests, so tests run the exact production pipeline. */
export function configureApp(app: INestApplication): INestApplication {
  const env = app.get<Env>(ENV);

  app.setGlobalPrefix(API_PREFIX);
  app.use(helmet());
  app.use(cookieParser());
  // Only the frontend may call the API from a browser, with its session cookies.
  app.enableCors({ origin: [env.WEB_URL], credentials: true });
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
