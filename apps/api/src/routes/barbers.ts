// Rotas de barbeiros (perfil de staff com % de comissão).
// Leitura: todos autenticados veem lista (precisa pra agendar).
// Escrita: só OWNER pode editar (commission_pct).

import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { schema } from '../db/client';
import { withTenant } from '../lib/with-tenant';
import { requireAuth, requireRole, attachAbility } from '../middleware/auth';

const updateBarberSchema = z.object({
  commissionPct: z.number().int().min(0).max(10000), // basis points (10000 = 100%)
  initials:      z.string().min(1).max(4).optional(),
  specialty:     z.string().max(120).optional(),
});

export async function barberRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', attachAbility);

  // GET /api/barbers — todos veem (precisa pra agendar)
  app.get('/', async (req, reply) => {
    if (!req.user) return reply.code(401).send({ error: 'Unauthorized' });
    return withTenant(req.user.tenantId, async (txDb) => {
      return txDb.select().from(schema.barbers);
    });
  });

  // GET /api/barbers/:id — detalhe (perfis de staff)
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    if (!req.user) return reply.code(401).send({ error: 'Unauthorized' });
    return withTenant(req.user.tenantId, async (txDb) => {
      const [barber] = await txDb
        .select()
        .from(schema.barbers)
        .where(eq(schema.barbers.id, (req.params as { id: string }).id))
        .limit(1);
      if (!barber) return reply.code(404).send({ error: 'NotFound' });
      return barber;
    });
  });

  // PATCH /api/barbers/:id — só OWNER (atualiza comissão + campos auxiliares)
  app.patch<{ Params: { id: string } }>(
    '/:id',
    { preHandler: requireRole('OWNER') },
    async (req, reply) => {
      if (!req.user) return reply.code(401).send({ error: 'Unauthorized' });
      const parsed = updateBarberSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'ValidationError', issues: parsed.error.issues });
      }

      const barberId = (req.params as { id: string }).id;
      const before = await withTenant(req.user.tenantId, async (txDb) => {
        const [b] = await txDb
          .select()
          .from(schema.barbers)
          .where(and(eq(schema.barbers.id, barberId), eq(schema.barbers.tenantId, req.user!.tenantId)))
          .limit(1);
        return b;
      });
      if (!before) return reply.code(404).send({ error: 'NotFound' });

      const updated = await withTenant(req.user.tenantId, async (txDb) => {
        const [u] = await txDb
          .update(schema.barbers)
          .set({
            ...parsed.data,
            // updatedAt não tá no schema ainda — pular pra evitar erro
          })
          .where(eq(schema.barbers.id, barberId))
          .returning();

        // Audit log — sensível (mudança de comissão)
        await txDb.insert(schema.auditLog).values({
          id:         randomUUID(),
          tenantId:   req.user!.tenantId,
          actorId:    req.user!.id,
          action:     'barber.commission_updated',
          resource:   'barber',
          resourceId: barberId,
          payload: {
            before: { commissionPct: before.commissionPct, initials: before.initials },
            after:  parsed.data,
          },
        });
        return u;
      });

      return reply.send(updated);
    },
  );
}
