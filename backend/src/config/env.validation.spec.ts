import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('refuse une configuration sans DATABASE_URL', () => {
    expect(() => validateEnv({})).toThrow('DATABASE_URL');
  });
  it('applique les valeurs par défaut', () => {
    const env = validateEnv({ DATABASE_URL: 'postgresql://x' });
    expect(env.PORT).toBe(3000);
    expect(env.FRONTEND_ORIGIN).toBe('http://localhost:5173');
  });
});
