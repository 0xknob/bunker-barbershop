// Validação de variáveis de ambiente com Zod.
// Falha rápido se algo crítico faltar (NODE_ENV, JWT_SECRET, DATABASE_URL).
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV:        z.enum(['development', 'test', 'production']).default('development'),
  PORT:            z.coerce.number().default(3001),
  DATABASE_URL:    z.string().url(),
  JWT_SECRET:      z.string().min(32),
  CORS_ORIGINS:    z.string().default('http://localhost:5173'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3001'),
});

export const env = envSchema.parse(process.env);
