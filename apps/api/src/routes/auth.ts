// Rotas auxiliares de auth: whoami (retorna role/tenantId baseado no user logado).

import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { schema } from '../db/client';
import { db } from '../db/client';
import { requireAuth } from '../middleware/auth';

export async function authRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true }));

  /**
   * GET /api/auth/whoami
   * Retorna dados do user + role + tenantId, lidos da nossa tabela `user_roles`
   * filtrados por userId. Sem filtro, qualquer usuário veria o role do primeiro
   * registro da tabela (bug sério que permitia privilege escalation).
   */
  app.get('/whoami', { preHandler: requireAuth }, async (req, reply) => {
    if (!req.user) return reply.code(401).send({ error: 'Unauthorized' });

    // ⚠️ user_roles.userId armazena BA.user.id (text), não email.
    // Filtro seguro: WHERE user_id = $1
    const rows = await db
      .select({
        tenantId: schema.userRoles.tenantId,
        role:     schema.userRoles.role,
      })
      .from(schema.userRoles)
      .where(eq(schema.userRoles.userId, req.user.id))
      .limit(1);

    // Se user não tem role cadastrado (caso novo), default CUSTOMER no tenant seed
    if (!rows[0]) {
      const [tenant] = await db
        .select({ id: schema.tenants.id })
        .from(schema.tenants)
        .limit(1);
      return reply.send({
        ...req.user,
        tenantId: tenant?.id ?? '',
        role:     'CUSTOMER',
      });
    }

    return reply.send({
      ...req.user,
      tenantId: rows[0].tenantId,
      role:     rows[0].role,
    });
  });
}
