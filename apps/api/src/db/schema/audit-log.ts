// Audit log — LGPD/GDPR compliance.
// Grava ações sensíveis: login, criação/cancelamento de appointment,
// mudança de preço/role/comissão, exportação de dados.
import { pgTable, uuid, varchar, jsonb, timestamp, text } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { users } from './users';

export const auditLog = pgTable('audit_log', {
  id:        uuid('id').primaryKey().defaultRandom(),
  tenantId:  uuid('tenant_id').notNull().references(() => tenants.id),
  actorId:   uuid('actor_id').references(() => users.id), // null se ação do sistema
  action:    varchar('action', { length: 60 }).notNull(),  // ex: 'appointment.cancelled'
  resource:  varchar('resource', { length: 60 }).notNull(),// ex: 'appointment'
  resourceId:uuid('resource_id'),
  payload:   jsonb('payload'),                              // before/after do recurso
  ip:        text('ip'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
