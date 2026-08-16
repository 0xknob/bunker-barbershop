// Pool de conexão Postgres (node-postgres).
// Singleton — uma instância por processo Fastify.
import { Pool } from 'pg';
import { env } from '../env';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
});

// Loga queries lentas em dev (>200ms). Em prod silencia.
pool.on('connect', () => {
  if (env.NODE_ENV === 'development') {
    console.log('[pg] nova conexão');
  }
});
