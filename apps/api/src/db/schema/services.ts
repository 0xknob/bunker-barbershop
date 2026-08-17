// Catálogo de serviços por tenant.
// price_cents em centavos evita float em moeda (R$ 35,00 → 3500).
// id é text pq o seed gera com randomUUID() como string (consistência com BA).
import { pgTable, text, uuid, varchar, text as textCol, integer, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const services = pgTable('services', {
  id:                   text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId:             uuid('tenant_id').notNull().references(() => tenants.id),
  name:                 varchar('name', { length: 80 }).notNull(),
  description:          textCol('description'),
  durationMin:          integer('duration_min').notNull(),
  bookingIntervalMin:   integer('booking_interval_min').notNull().default(30),
  bufferMin:            integer('buffer_min').notNull().default(15),
  priceCents:           integer('price_cents').notNull(),
  createdAt:            timestamp('created_at').defaultNow().notNull(),
  updatedAt:            timestamp('updated_at').defaultNow().notNull(),
  deletedAt:            timestamp('deleted_at'),
});
