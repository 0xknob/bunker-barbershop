// Regras de negócio de agendamento.
// Janela de cancelamento (24h), cálculo de late_cancel, etc.

const CANCEL_WINDOW_HOURS = 24;

/** Retorna true se a data de início já passou da janela mínima de cancelamento. */
export function isLateCancel(startsAt: Date, now: Date = new Date()): boolean {
  const diffMs = startsAt.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours < CANCEL_WINDOW_HOURS;
}

/** Calcula end baseado em start + duração (em minutos). */
export function calcEndsAt(startsAt: Date, durationMin: number): Date {
  return new Date(startsAt.getTime() + durationMin * 60_000);
}
