// Perfil estendido de BARBER. 1:1 com users quando o user tem role BARBER.
// commission_pct em basis points (1000 = 10.00%).
import { pgTable, uuid, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { users } from './users';

export const barbers = pgTable('barbers', {
  id:              uuid('id').primaryKey().defaultRandom(),
  userId:          uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  tenantId:        uuid('tenant_id').notNull().references(() => tenants.id),
  specialty:       varchar('specialty', { length: 120 }),
  initials:        varchar('initials', { length: 4 }),  // ex: "RT" pra Rui Tesoura
  commissionPct:   integer('commission_pct').notNull().default(5000), // 50% em bps
  createdAt:       timestamp('created_at').defaultNow().notNull(),
  deletedAt:       timestamp('deleted_at'),
});
