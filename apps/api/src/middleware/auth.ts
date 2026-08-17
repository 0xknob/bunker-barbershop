// Middlewares de auth (preHandler) para usar nas rotas Fastify.
// 1. requireAuth: garante que request.user existe (sessão válida)
// 2. requireRole: garante que o role do user está na lista permitida
// 3. attachAbility: popula request.ability com a CASL ability do role
//
// Uso típico:
//   app.get('/api/admin',
//     { preHandler: [requireAuth, requireRole('OWNER')] },
//     handler,
//   );

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Role } from '../db/schema/user-roles';
import { defineAbilityFor, type AppAbility } from '@barbearia-retro/shared/ability';

declare module 'fastify' {
  interface FastifyRequest {
    ability?: AppAbility;
  }
}

/** Garante que o usuário está autenticado. 401 caso contrário. */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  if (!req.user) {
    return reply.code(401).send({ error: 'Unauthorized', message: 'Sessão inválida ou expirada.' });
  }
}

/** Garante que o role do user está entre os permitidos. 403 caso contrário. */
export function requireRole(...roles: Role[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    // role do user vem do user_roles — vamos checar via DB em hook mais elaborado.
    // Por enquanto, simplificamos: o role está em req.user.role (commit futuro injeta).
    const userRole = (req.user as { role?: Role }).role;
    if (!userRole || !roles.includes(userRole)) {
      return reply.code(403).send({ error: 'Forbidden', message: `Requer role: ${roles.join(' | ')}` });
    }
  };
}

/** Popula request.ability com a CASL ability do usuário autenticado. */
export async function attachAbility(req: FastifyRequest, _reply: FastifyReply) {
  if (!req.user) return;
  const role = (req.user as { role?: Role }).role ?? 'CUSTOMER';
  req.ability = defineAbilityFor(role, { userId: req.user.id, tenantId: req.user.tenantId });
}
