// Schemas Zod compartilhados entre API e (futuramente) front.
// Validação acontece no boundary da request — nunca confie no body cru.

import { z } from 'zod';

const guestInfo = z.object({
  name:  z.string().min(1).max(120),
  email: z.string().email().max(255),
  phone: z.string().max(20).optional(),
});

/**
 * CreateAppointment aceita 2 modos:
 * (a) CUSTOMER logado: só { serviceId, barberId, startsAt }
 * (b) Visitante:     + { guest: { name, email, phone? } }
 *
 * Refinamento garante que tem OU customerId (via session) OU guest completo.
 */
export const createAppointmentSchema = z
  .object({
    serviceId: z.string().min(1),
    barberId:  z.string().min(1),
    startsAt:  z.string().datetime(), // ISO 8601
    guest:     guestInfo.optional(),
  });

export const cancelAppointmentSchema = z.object({
  reason: z.string().max(200).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
