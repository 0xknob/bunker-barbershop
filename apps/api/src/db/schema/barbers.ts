// Perfil estendido de BARBER. 1:1 com BA.user (FK por text, não uuid).
// commission_pct em basis points (1000 = 10.00%).
import { pgTable, text, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const barbers = pgTable('barbers', {
  id:              text('id').primaryKey(),
  userId:          text('user_id').notNull().unique(),
  tenantId:        uuid('tenant_id').notNull().references(() => tenants.id),
  specialty:       varchar('specialty', { length: 120 }),
  initials:        varchar('initials', { length: 4 }),
  commissionPct:   integer('commission_pct').notNull().default(5000),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
  deletedAt:       timestamp('deleted_at'),
});
