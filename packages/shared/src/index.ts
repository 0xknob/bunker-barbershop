// Shared types and Zod schemas entre front-end e back-end.
// Este package garante que validação e tipos ficam em sincronia.

export const ROLES = ['OWNER', 'BARBER', 'CUSTOMER'] as const;
export type Role = (typeof ROLES)[number];

export const APPOINTMENT_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
