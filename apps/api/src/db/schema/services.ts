// Catálogo de serviços por tenant.
// price_cents em centavos evita float em moeda (R$ 35,00 → 3500).
// booking_interval_min: granularidade dos slots (30min default).
// buffer_min: tempo extra entre slots consecutivos do mesmo barbeiro.
import { pgTable, uuid, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const services = pgTable('services', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  tenantId:             uuid('tenant_id').notNull().references(() => tenants.id),
  name:                 varchar('name', { length: 80 }).notNull(),
  description:          text('description'),
  durationMin:          integer('duration_min').notNull(),
  bookingIntervalMin:   integer('booking_interval_min').notNull().default(30),
  bufferMin:            integer('buffer_min').notNull().default(15),
  priceCents:           integer('price_cents').notNull(),
  createdAt:            timestamp('created_at').defaultNow().notNull(),
  updatedAt:            timestamp('updated_at').defaultNow().notNull(),
  deletedAt:            timestamp('deleted_at'),
});
