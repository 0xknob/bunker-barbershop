// Bloqueios de agenda — barbeiro pode bloquear dia inteiro ou horário.
// createdBy é text (BA.user.id).
import { pgTable, text, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { barbers } from './barbers';

export const scheduleBlocks = pgTable('schedule_blocks', {
  id:        text('id').primaryKey(),
  tenantId:  uuid('tenant_id').notNull().references(() => tenants.id),
  barberId:  text('barber_id').notNull().references(() => barbers.id),
  startsAt:  timestamp('starts_at').notNull(),
  endsAt:    timestamp('ends_at').notNull(),
  reason:    varchar('reason', { length: 80 }),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
