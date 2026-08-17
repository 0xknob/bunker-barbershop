// Audit log — LGPD/GDPR compliance.
// actorId e resourceId são text (BA.user.id).
import { pgTable, text, uuid, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const auditLog = pgTable('audit_log', {
  id:        text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId:  uuid('tenant_id').notNull().references(() => tenants.id),
  actorId:   text('actor_id'),
  action:    varchar('action', { length: 60 }).notNull(),
  resource:  varchar('resource', { length: 60 }).notNull(),
  resourceId:text('resource_id'),
  payload:   jsonb('payload'),
  ip:        text('ip'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
