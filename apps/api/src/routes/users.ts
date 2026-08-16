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
  app.get('/staff', { preHandler: requireRole('OWNER') }, async (req, reply) => {
    if (!req.user) return reply.code(401).send({ error: 'Unauthorized' });
    return withTenant(req.user.tenantId, async (txDb) => {
      // JOIN users + barbers (e futuro customer service)
      return txDb
        .select({
          id:     schema.users.id,
          name:   schema.users.name,
          email:  schema.users.email,
          role:   schema.userRoles.role,
        })
        .from(schema.users)
        .innerJoin(schema.userRoles, eq(schema.userRoles.userId, schema.users.id))
        .where(eq(schema.userRoles.tenantId, req.user!.tenantId));
    });
  });
}
