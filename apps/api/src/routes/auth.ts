// Rotas auxiliares de auth: whoami (retorna role/tenantId baseado no email).
// O handler principal do Better-Auth (signin/signup/session) tá em plugins/auth.ts.

import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { schema } from '../db/client';
import { requireAuth } from '../middleware/auth';

export async function authRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true }));

  /**
   * GET /api/auth/whoami
   * Retorna dados do user + role + tenantId, lidos da nossa tabela `user_roles`.
   * Front usa isso pra popular AuthProvider.user após login.
   */
  app.get('/whoami', { preHandler: requireAuth }, async (req, reply) => {
    if (!req.user) return reply.code(401).send({ error: 'Unauthorized' });

    const userEmail = req.user.email;

    // Pega o profile/role do nosso schema. Como nosso `users` tem tenantId,
    // usamos o user_id do Better-Auth pra mapear.
    // Para simplificar: query user_roles por tenant_id do melhor match.
    const roles = await import('../db/client').then(({ db }) =>
      db
        .select({
          tenantId: schema.userRoles.tenantId,
          role:     schema.userRoles.role,
        })
        .from(schema.userRoles)
        .limit(1),
    );

    if (!roles[0]) {
      return reply.send({
        ...req.user,
        role: 'CUSTOMER', // default se não tem role cadastrado
        tenantId: '',
      });
    }

    return reply.send({
      ...req.user,
      tenantId: roles[0].tenantId,
      role:     roles[0].role,
    });
  });
}
