// Tabela tenants — uma linha por barbearia cadastrada.
// Multi-tenant desde o dia 1: todo dado pertence a um tenant_id.
import { pgTable, uuid, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
  id:        uuid('id').primaryKey().defaultRandom(),
  name:      varchar('name', { length: 100 }).notNull(),
  slug:      varchar('slug', { length: 50 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
