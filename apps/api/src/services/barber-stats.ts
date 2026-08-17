// Regras de cálculo do dashboard do profissional.
// Funções puras — recebem dados já carregados, retornam métricas.
// Testáveis sem DB mock.

export interface AppointmentRow {
  startsAt: Date;
  endsAt: Date;
  status: string;       // CONFIRMED | COMPLETED | CANCELLED | PENDING | NO_SHOW
  priceCents: number;
  serviceId: string;
  customerId: string;
}

export interface ServiceRow {
  id: string;
  name: string;
  durationMin: number;
}

/**
 * Calcula estatísticas de um conjunto de appointments do profissional.
 * - Recebe appointments + servicos pra mapear nome/duração
 * - Considera apenas status COMPLETED pra receita
 * - Cancelled/NO_SHOW nao contam pra receita mas contam pra taxa de cancel
 */
export interface BarberStats {
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  totalRevenueCents: number;      // soma de COMPLETED
  commissionCents: number;         // totalRevenueCents * commissionPct / 10000
  totalDurationMin: number;        // soma de durações dos COMPLETED
  averageTicketCents: number;      // totalRevenue / completedCount
}

export function computeBarberStats(
  appointments: AppointmentRow[],
  services: ServiceRow[],
  commissionPct: number,           // basis points (5000 = 50%)
): BarberStats {
  const completed = appointments.filter(a => a.status === 'COMPLETED');
  const cancelled = appointments.filter(a => a.status === 'CANCELLED');
  const noShow    = appointments.filter(a => a.status === 'NO_SHOW');

  const totalRevenue = completed.reduce((s, a) => s + a.priceCents, 0);
  const totalDuration = completed.reduce((s, a) => {
    const svc = services.find(x => x.id === a.serviceId);
    return s + (svc?.durationMin ?? 0);
  }, 0);

  return {
    completedCount:    completed.length,
    cancelledCount:    cancelled.length,
    noShowCount:       noShow.length,
    totalRevenueCents: totalRevenue,
    commissionCents:    Math.floor((totalRevenue * commissionPct) / 10000),
    totalDurationMin:   totalDuration,
    averageTicketCents: completed.length > 0 ? Math.floor(totalRevenue / completed.length) : 0,
  };
}

/**
 * Filtra appointments pra um range de datas (inclusivo nas duas pontas).
 */
export function appointmentsInRange(
  appointments: AppointmentRow[],
  from: Date,
  to: Date,
): AppointmentRow[] {
  return appointments.filter(a => {
    const t = a.startsAt.getTime();
    return t >= from.getTime() && t <= to.getTime();
  });
}

/**
 * Agrupa top N serviços por frequência (quantos cortes foram feitos).
 */
export function topServices(
  appointments: AppointmentRow[],
  services: ServiceRow[],
  limit = 5,
): Array<{ service: ServiceRow; count: number; revenueCents: number }> {
  const map = new Map<string, { count: number; revenueCents: number }>();
  for (const a of appointments) {
    if (a.status !== 'COMPLETED') continue;
    const cur = map.get(a.serviceId) ?? { count: 0, revenueCents: 0 };
    cur.count += 1;
    cur.revenueCents += a.priceCents;
    map.set(a.serviceId, cur);
  }
  return Array.from(map.entries())
    .map(([id, v]) => ({
      service: services.find(s => s.id === id) ?? { id, name: '—', durationMin: 0 },
      count: v.count,
      revenueCents: v.revenueCents,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Converte minutos em texto legível ("2h 15min", "45min", "1h")
 */
export function formatMinutes(min: number): string {
  if (min === 0) return '0min';
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}
