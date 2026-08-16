// Helper pra executar uma query dentro de um tenant específico.
// Usado pelos services que precisam garantir isolamento por tenant_id.
//
// Exemplo:
//   await withTenant(tenantId, async (db) => {
//     return db.select().from(appointments);
//   });
//
// Como funciona:
//   1. Pega cliente do pool
//   2. BEGIN transaction
//   3. SET LOCAL app.tenant_id = $1  (RLS usa essa session var)
//   4. Executa callback
//   5. COMMIT (ou ROLLBACK se callback throw)
//
// `SET LOCAL` reseta no fim da transação — não vaza entre requests.

import { pool } from './db';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';

export async function withTenant<T>(
  tenantId: string,
  fn: (db: ReturnType<typeof drizzle<typeof schema>>) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT set_config($1, $2, true)', ['app.tenant_id', tenantId]);
    const db = drizzle(client, { schema });
    const result = await fn(db);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
