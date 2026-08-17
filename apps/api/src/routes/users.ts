// Rotas de leitura de usuários/barbeiros.
// Retorna dados do próprio usuário sempre; lista de barbeiros pra
// qualquer um (precisa pra agendar); lista de staff só OWNER.

import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { schema } from '../db/client';
import { withTenant } from '../lib/with-tenant';
import { requireAuth, requireRole, attachAbility } from '../middleware/auth';

export async function userRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', attachAbility);

  // ── GET /api/users/me ─────────────────────────────────────────
  app.get('/me', async (req, reply) => {
    if (!req.user) return reply.code(401).send({ error: 'Unauthorized' });
    return reply.send(req.user);
  });

  // ── GET /api/users/barbers ────────────────────────────────────
  // Lista barbeiros do tenant. Todos podem ver (precisa pra agendar).
  app.get('/barbers', async (req, reply) => {
    if (!req.user) return reply.code(401).send({ error: 'Unauthorized' });
    return withTenant(req.user.tenantId, async (txDb) => {
      return txDb.select().from(schema.barbers).where(eq(schema.barbers.tenantId, req.user!.tenantId));
    });
  });

  // ── GET /api/users/staff — só OWNER ──────────────────────────
  // Lista staff + roles do tenant. Como auth.users mora em BA (não no nosso
  // schema), fazemos 2 queries: roles (nosso DB) + users do staff via BA.
  app.get('/staff', { preHandler: requireRole('OWNER') }, async (req, reply) => {
    if (!req.user) return reply.code(401).send({ error: 'Unauthorized' });
    return withTenant(req.user.tenantId, async (txDb) => {
      const roles = await txDb
        .select({
          userId:   schema.userRoles.userId,
          tenantId: schema.userRoles.tenantId,
          role:     schema.userRoles.role,
        })
        .from(schema.userRoles)
        .where(eq(schema.userRoles.tenantId, req.user!.tenantId));

      // Enriquece com nome/email via query direta no BA.user
      const { Pool } = await import('pg');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const userIds = roles.map(r => r.userId);
      if (userIds.length === 0) { await pool.end(); return []; }
      const result = await pool.query('SELECT id, name, email FROM "user" WHERE id = ANY($1)', [userIds]);
      await pool.end();

      const userMap = new Map(result.rows.map(u => [u.id, u]));

      // Enriquece BARBERS com commissionPct (cliente usa pra exibir/editar)
      const barbers = await txDb.select().from(schema.barbers);
      const commissionByUserId = new Map(barbers.map(b => [b.userId, b.commissionPct]));

      return roles.map(r => ({
        id:             r.userId,
        name:           userMap.get(r.userId)?.name ?? '—',
        email:          userMap.get(r.userId)?.email ?? '—',
        role:           r.role,
        commissionPct:  commissionByUserId.get(r.userId) ?? null,
      }));
    });
  });
}
