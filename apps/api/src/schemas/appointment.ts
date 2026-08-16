// Schemas Zod compartilhados entre API e (futuramente) front.
// Validação acontece no boundary da request — nunca confie no body cru.

import { z } from 'zod';

export const createAppointmentSchema = z.object({
  serviceId: z.string().uuid(),
  barberId:  z.string().uuid(),
  startsAt:  z.string().datetime(), // ISO 8601, ex: '2026-08-17T10:00:00Z'
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().max(200).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
