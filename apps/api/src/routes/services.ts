// CRUD de serviços. Leitura aberta pra qualquer usuário autenticado
// (até CUSTOMER precisa ver o catálogo). Criação/edição só OWNER.

import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { schema } from '../db/client';
import { withTenant } from '../lib/with-tenant';
import { requireAuth, requireRole, attachAbility } from '../middleware/auth';

const createServiceSchema = z.object({
  name:                z.string().min(2).max(80),
  description:         z.string().max(280).optional(),
  durationMin:         z.number().int().min(5).max(480),
  bookingIntervalMin:  z.number().int().min(5).max(120).default(30),
  bufferMin:           z.number().int().min(0).max(120).default(15),
  priceCents:          z.number().int().min(0),
});

export async function serviceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', attachAbility);

  // ── GET /api/services ─────────────────────────────────────────
  // Lista serviços do tenant. CUSTOMER pode ver (precisa pra agendar).
  app.get('/', async (req, reply) => {
    if (!req.user) return reply.code(401).send({ error: 'Unauthorized' });
    return withTenant(req.user.tenantId, async (txDb) => {
      return txDb.select().from(schema.services).where(eq(schema.services.tenantId, req.user!.tenantId));
    });
  });

  // ── POST /api/services — só OWNER ────────────────────────────
  app.post('/', { preHandler: requireRole('OWNER') }, async (req, reply) => {
    if (!req.user) return reply.code(401).send({ error: 'Unauthorized' });
    const parsed = createServiceSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'ValidationError', issues: parsed.error.issues });

    return withTenant(req.user.tenantId, async (txDb) => {
      const [created] = await txDb
        .insert(schema.services)
        .values({ ...parsed.data, tenantId: req.user!.tenantId })
        .returning();
      // audit log
      await txDb.insert(schema.auditLog).values({
        id:         randomUUID(),
        tenantId:   req.user!.tenantId,
        actorId:    req.user!.id,
        action:     'service.created',
        resource:   'service',
        resourceId: created!.id,
        payload:    parsed.data,
      });
      return reply.code(201).send(created);
    });
  });
}
