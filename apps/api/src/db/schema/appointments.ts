// Agendamentos — coração do app.
// Status: PENDING → CONFIRMED → COMPLETED | CANCELLED | NO_SHOW.
// late_cancel = true se cliente cancelou fora da janela (24h).
import { pgTable, uuid, varchar, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { users } from './users';
import { services } from './services';
import { barbers } from './barbers';

export const APPOINTMENT_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const appointments = pgTable('appointments', {
  id:           uuid('id').primaryKey().defaultRandom(),
  tenantId:     uuid('tenant_id').notNull().references(() => tenants.id),
  customerId:   uuid('customer_id').notNull().references(() => users.id),
  barberId:     uuid('barber_id').notNull().references(() => barbers.id),
  serviceId:    uuid('service_id').notNull().references(() => services.id),
  startsAt:     timestamp('starts_at').notNull(),
  endsAt:       timestamp('ends_at').notNull(),
  // preço congelado no momento do booking (não muda se service.preço mudar depois)
  priceCents:   integer('price_cents').notNull(),
  status:       varchar('status', { length: 20 }).$type<AppointmentStatus>().notNull().default('CONFIRMED'),
  lateCancel:   boolean('late_cancel').notNull().default(false),
  cancelledAt:  timestamp('cancelled_at'),
  cancelledBy:  uuid('cancelled_by').references(() => users.id),
  noShow:       boolean('no_show').notNull().default(false),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
  updatedAt:    timestamp('updated_at').defaultNow().notNull(),
  deletedAt:    timestamp('deleted_at'),
});
