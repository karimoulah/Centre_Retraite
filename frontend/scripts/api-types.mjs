// Generates src/lib/api/schema.d.ts from the NestJS Swagger document.
// Usage: API_SWAGGER_URL=http://localhost:3000/api/docs-json npm run api:types
import { execFileSync } from 'node:child_process';

const url = process.env.API_SWAGGER_URL ?? 'http://localhost:3000/api/docs-json';
execFileSync('npx', ['openapi-typescript', url, '-o', 'src/lib/api/schema.d.ts'], {
  stdio: 'inherit',
});
