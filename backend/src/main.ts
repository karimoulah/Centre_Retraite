import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { configureApp } from './bootstrap';
import { loadDotEnv } from './config/config';
import { ENV, type Env } from './config/config.module';

async function bootstrap() {
  loadDotEnv();
  const app = configureApp(await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true }));
  app.useLogger(app.get(Logger));
  await app.listen(app.get<Env>(ENV).PORT);
}

void bootstrap();
