// Bloqueios de agenda — barbeiro pode bloquear dia inteiro ou horário.
// Motivos típicos: almoço, folga, compromisso.
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { barbers } from './barbers';
import { users } from './users';

export const scheduleBlocks = pgTable('schedule_blocks', {
  id:        uuid('id').primaryKey().defaultRandom(),
  tenantId:  uuid('tenant_id').notNull().references(() => tenants.id),
  barberId:  uuid('barber_id').notNull().references(() => barbers.id),
  startsAt:  timestamp('starts_at').notNull(),
  endsAt:    timestamp('ends_at').notNull(),
  reason:    varchar('reason', { length: 80 }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
