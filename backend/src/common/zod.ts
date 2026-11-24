import { z } from 'zod';

// Default validation messages in French for every schema of the API.
z.config(z.locales.fr());

export { z };
