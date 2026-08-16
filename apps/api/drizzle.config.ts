import { defineConfig } from 'drizzle-kit';

// drizzle-kit lê esse arquivo pra gerar migrations e aplicar schema no DB.
// DATABASE_URL vem de apps/api/.env (não commitar).
export default defineConfig({
  schema: './src/db/schema/index.ts',
  out:    './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://bunker:bunker@localhost:5432/bunker',
  },
  verbose: true,
  strict: true,
});
