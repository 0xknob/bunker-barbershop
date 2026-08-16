// Cliente Drizzle — usado em todas as queries da API.
// Recebe o pool Postgres e expõe API type-safe.
import { drizzle } from 'drizzle-orm/node-postgres';
import { pool } from './db';
import * as schema from './schema';

export const db = drizzle(pool, { schema });
export { schema };
