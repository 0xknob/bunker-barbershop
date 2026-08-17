// Agendamentos — coração do app.
// Status: PENDING → CONFIRMED → COMPLETED | CANCELLED | NO_SHOW.
// late_cancel = true se cliente cancelou fora da janela (24h).
// customerId e barberId são text (FK pra BA.user.id / nosso barbers.id).
import { pgTable, text, uuid, varchar, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
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
  id:           text('id').primaryKey(),
  tenantId:     uuid('tenant_id').notNull().references(() => tenants.id),
  // customerId é Nullable pra suportar agendamento como visitante
  // (nesse caso populamos guestName/guestEmail/guestPhone no próprio appointment)
  customerId:   text('customer_id'),                    // BA.user.id (opcional)
  guestName:    varchar('guest_name', { length: 120 }),
  guestEmail:   varchar('guest_email', { length: 255 }),
  guestPhone:   varchar('guest_phone', { length: 20 }),
  barberId:     text('barber_id').notNull().references(() => barbers.id),
  serviceId:    text('service_id').notNull().references(() => services.id),
  startsAt:     timestamp('starts_at').notNull(),
  endsAt:       timestamp('ends_at').notNull(),
  priceCents:   integer('price_cents').notNull(),
  status:       varchar('status', { length: 20 }).$type<AppointmentStatus>().notNull().default('CONFIRMED'),
  lateCancel:   boolean('late_cancel').notNull().default(false),
  cancelledAt:  timestamp('cancelled_at'),
  cancelledBy:  text('cancelled_by'),
  noShow:       boolean('no_show').notNull().default(false),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
  updatedAt:    timestamp('updated_at').defaultNow().notNull(),
  deletedAt:    timestamp('deleted_at'),
});
