// RBAC — papel do usuário dentro de um tenant.
// PK composta (user_id, tenant_id) permite que o mesmo user tenha papéis
// diferentes em barbearias diferentes (ex: BARBER na Bunker, CUSTOMER em outra).
import { pgTable, uuid, varchar, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { users } from './users';

// Enum é declarado inline porque Drizzle ainda não tem helper dedicado pro PG enum.
// Mantemos compatibilidade usando varchar com check via Zod no app.
export const ROLES = ['OWNER', 'BARBER', 'CUSTOMER'] as const;
export type Role = (typeof ROLES)[number];

export const userRoles = pgTable(
  'user_roles',
  {
    userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    tenantId:  uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    role:      varchar('role', { length: 20 }).$type<Role>().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.tenantId, t.role] })],
);
