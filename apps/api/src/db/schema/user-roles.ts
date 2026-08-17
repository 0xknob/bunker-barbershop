// RBAC — papel do usuário dentro de um tenant.
// userId é text (não uuid) porque referencia Better-Auth.user.id, que é string
// gerada pelo BA. tenantId continua uuid (nosso domínio).
// Vínculo BA.user ↔ nosso users é feito via email em /api/auth/whoami.

import { pgTable, text, uuid, varchar, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const ROLES = ['OWNER', 'BARBER', 'CUSTOMER'] as const;
export type Role = (typeof ROLES)[number];

export const userRoles = pgTable(
  'user_roles',
  {
    userId:    text('user_id').notNull(),
    tenantId:  uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    role:      varchar('role', { length: 20 }).$type<Role>().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.tenantId, t.role] })],
);
