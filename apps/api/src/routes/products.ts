// Rotas CRUD de produtos.
// - GET é PÚBLICO (rota raiz /) — vê apenas is_active=true e sell_online=true
// - GET com `?all=true` requer OWNER (vê tudo incluindo inativos)
// - POST/PATCH/DELETE requer OWNER
// - Soft-delete via deletedAt (DELETE = set deletedAt)

import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { z } from 'zod';
import { schema } from '../db/client';
import { withTenant } from '../lib/with-tenant';
import { requireAuth, requireRole } from '../middleware/auth';

const createProductSchema = z.object({
  sku:               z.string().max(60).optional(),
  name:              z.string().min(1).max(120),
  description:       z.string().max(500).optional(),
  category:          z.string().max(60).optional(),
  imageUrl:          z.string().url().optional(),
  retailPriceCents:  z.number().int().min(0),
  costPriceCents:    z.number().int().min(0).default(0),
  currentStock:      z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  isActive:          z.boolean().default(true),
  sellOnline:        z.boolean().default(true),
});

const updateProductSchema = createProductSchema.partial();

export async function productRoutes(app: FastifyInstance) {

  // GET /api/products — PÚBLICO (catálogo da landing page)
  // Sem auth required. Retorna só produtos ativos e visíveis online.
  app.get('/', async (req, reply) => {
    const { all } = req.query as { all?: string };

    // Se pediu ?all=true, requer OWNER
    if (all === 'true') {
      const user = req.user;
      if (!user || user.role !== 'OWNER') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Só OWNER pode listar todos' });
      }
      return withTenant(user.tenantId, async (txDb) => {
        return txDb
          .select()
          .from(schema.products)
          .where(eq(schema.products.tenantId, user.tenantId))
          .orderBy(desc(schema.products.createdAt));
      });
    }

    // Listagem pública: requer um tenantId — usa o primeiro tenant ativo
    // (MVP single-tenant). Em v0.4 multi-tenant, isso vira `tenantSlug` na URL.
    return withTenantGlobal(async (txDb) => {
      return txDb
        .select({
          id:                schema.products.id,
          name:              schema.products.name,
          description:       schema.products.description,
          category:          schema.products.category,
          imageUrl:          schema.products.imageUrl,
          retailPriceCents:  schema.products.retailPriceCents,
          sellOnline:        schema.products.sellOnline,
          currentStock:      schema.products.currentStock,
        })
        .from(schema.products)
        .where(
          and(
            eq(schema.products.isActive, true),
            eq(schema.products.sellOnline, true),
            isNull(schema.products.deletedAt),
          ),
        )
        .orderBy(desc(schema.products.createdAt));
    });
  });

  // GET /api/products/:id — PÚBLICO (detalhe)
  app.get<{ Params: { id: string } }>('/:id', async (req) => {
    return withTenantGlobal(async (txDb) => {
      const [p] = await txDb
        .select()
        .from(schema.products)
        .where(
          and(
            eq(schema.products.id, (req.params as { id: string }).id),
            eq(schema.products.isActive, true),
            eq(schema.products.sellOnline, true),
            isNull(schema.products.deletedAt),
          ),
        )
        .limit(1);
      return p ?? { error: 'NotFound' };
    });
  });

  // POST /api/products — só OWNER
  app.post('/', { preHandler: requireRole('OWNER') }, async (req, reply) => {
    if (!req.user) return reply.code(401).send({ error: 'Unauthorized' });
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'ValidationError', issues: parsed.error.issues });

    return withTenant(req.user.tenantId, async (txDb) => {
      const [created] = await txDb
        .insert(schema.products)
        .values({
          id:        randomUUID(),
          tenantId:  req.user!.tenantId,
          ...parsed.data,
        })
        .returning();

      // audit log (LGPD: criação de produto)
      await txDb.insert(schema.auditLog).values({
        id:         randomUUID(),
        tenantId:   req.user!.tenantId,
        actorId:    req.user!.id,
        action:     'product.created',
        resource:   'product',
        resourceId: created!.id,
        payload:    parsed.data,
      });

      return reply.code(201).send(created);
    });
  });

  // PATCH /api/products/:id — só OWNER (atualiza preço/estoque/etc)
  app.patch<{ Params: { id: string } }>(
    '/:id',
    { preHandler: requireRole('OWNER') },
    async (req, reply) => {
      if (!req.user) return reply.code(401).send({ error: 'Unauthorized' });
      const parsed = updateProductSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'ValidationError', issues: parsed.error.issues });

      const productId = (req.params as { id: string }).id;

      return withTenant(req.user.tenantId, async (txDb) => {
        const [before] = await txDb
          .select()
          .from(schema.products)
          .where(eq(schema.products.id, productId))
          .limit(1);
        if (!before) return reply.code(404).send({ error: 'NotFound' });

        const [updated] = await txDb
          .update(schema.products)
          .set({
            ...parsed.data,
            updatedAt: new Date(),
          })
          .where(eq(schema.products.id, productId))
          .returning();

        await txDb.insert(schema.auditLog).values({
          id:         randomUUID(),
          tenantId:   req.user!.tenantId,
          actorId:    req.user!.id,
          action:     'product.updated',
          resource:   'product',
          resourceId: productId,
          payload:    { before: parsed.data },
        });

        return reply.send(updated);
      });
    },
  );

  // DELETE /api/products/:id — só OWNER (soft-delete)
  app.delete<{ Params: { id: string } }>(
    '/:id',
    { preHandler: requireRole('OWNER') },
    async (req, reply) => {
      if (!req.user) return reply.code(401).send({ error: 'Unauthorized' });
      const productId = (req.params as { id: string }).id;

      return withTenant(req.user.tenantId, async (txDb) => {
        const [updated] = await txDb
          .update(schema.products)
          .set({ deletedAt: new Date(), isActive: false })
          .where(eq(schema.products.id, productId))
          .returning();

        if (!updated) return reply.code(404).send({ error: 'NotFound' });

        await txDb.insert(schema.auditLog).values({
          id:         randomUUID(),
          tenantId:   req.user!.tenantId,
          actorId:    req.user!.id,
          action:     'product.deleted',
          resource:   'product',
          resourceId: productId,
        });

        return reply.code(204).send();
      });
    },
  );
}

// Helper pra queries PÚBLICAS (sem session var de tenant).
// Usa um connection fresca e desabilita RLS via session_replication_role via
// workaround: conecta com role que tem BYPASSRLS. No MVP single-tenant
// usamos o primeiro tenant ativo hardcoded.
//
// NOTA: em produção multi-tenant real, a rota pública recebe um tenantSlug
// na URL e seta app.tenant_id antes da query.
import { db } from '../db/client';
import * as schemaModule from '../db/schema';
import { sql } from 'drizzle-orm';

async function withTenantGlobal<T>(
  fn: (txDb: ReturnType<typeof drizzle>) => Promise<T>,
): Promise<T> {
  // Pega o primeiro tenant — MVP single-tenant
  const [tenant] = await db
    .select({ id: schemaModule.tenants.id })
    .from(schemaModule.tenants)
    .limit(1);
  if (!tenant) throw new Error('Nenhum tenant cadastrado');

  const { withTenant } = await import('../lib/with-tenant');
  return withTenant(tenant.id, fn);
}
