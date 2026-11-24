import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { ENV, type Env } from '../../config/config.module';

/** Paths masked in every log line (request bodies, headers, cookies). */
export const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  '*.password',
  '*.token',
  '*.email',
  '*.passwordHash',
];

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ENV],
      useFactory: (env: Env) => ({
        pinoHttp: {
          level: env.LOG_LEVEL,
          redact: { paths: REDACTED_PATHS, censor: '[masqué]' },
          autoLogging: { ignore: (req) => req.url?.endsWith('/health') ?? false },
          transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty', options: { singleLine: true } } : undefined,
        },
      }),
    }),
  ],
})
export class LoggingModule {}
