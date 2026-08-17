// GET /api/barbers/me/dashboard — endpoint dedicado pro BarberPanel.
// Retorna metricas agregadas + lista de appointments e servicos uteis.
//
// Auth: BARBER ou OWNER logado.
// - BARBER: so ve os proprios dados
// - OWNER: ve os proprios (se for tambem barbeiro) OU passa ?barberId=X
//
// v0.4: limitar por date range (?from=...&to=...) — em v0.3 retorna tudo.

import type { FastifyInstance } from 'fastify';
import { eq, and, gte, lte, desc, isNull } from 'drizzle-orm';
import { schema } from '../db/client';
import { withTenant } from '../lib/with-tenant';
import { requireAuth } from '../middleware/auth';
import { computeBarberStats, topServices, formatMinutes } from '../services/barber-stats';

export async function barberDashboardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/me/dashboard', async (req, reply) => {
    if (!req.user) return reply.code(401).send({ error: 'Unauthorized' });

    return withTenant(req.user.tenantId, async (txDb) => {
      // Acha o profile de barbeiro do user logado (ou passado via ?barberId)
      const { barberId: queryBarberId } = req.query as { barberId?: string };
      const targetBarberId = queryBarberId ?? null;

      let barber;
      if (targetBarberId) {
        // Path OWNER vendo outro barbeiro — exige role OWNER
        if ((req.user as { role?: string }).role !== 'OWNER') {
          return reply.code(403).send({ error: 'Forbidden', message: 'Só OWNER pode ver outros barbeiros' });
        }
        const [b] = await txDb
          .select()
          .from(schema.barbers)
          .where(and(eq(schema.barbers.id, targetBarberId), eq(schema.barbers.tenantId, req.user.tenantId)))
          .limit(1);
        if (!b) return reply.code(404).send({ error: 'BarberNotFound' });
        barber = b;
      } else {
        // Path BARBER vendo a si mesmo
        const [b] = await txDb
          .select()
          .from(schema.barbers)
          .where(and(eq(schema.barbers.userId, req.user.id), eq(schema.barbers.tenantId, req.user.tenantId)))
          .limit(1);
        if (!b) return reply.code(404).send({ error: 'NotABarber', message: 'Voce nao tem perfil de barbeiro.' });
        barber = b;
      }

      // Carrega appointments do barbeiro
      const allAppts = await txDb
        .select()
        .from(schema.appointments)
        .where(eq(schema.appointments.barberId, barber.id));

      const services = await txDb
        .select({ id: schema.services.id, name: schema.services.name, durationMin: schema.services.durationMin })
        .from(schema.services);

      // Helpers: inicio/fim de hoje e da semana (segunda)
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday   = new Date(startOfToday.getTime() + 24 * 60 * 60_000 - 1);
      const startOfWeek = (() => {
        const d = new Date(startOfToday);
        const dow = d.getDay() || 7; // dom=0 -> 7 (seg=1)
        if (dow > 1) d.setDate(d.getDate() - (dow - 1));
        return d;
      })();
      const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60_000 - 1);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Appoints como objetos "puros" pro service layer
      const apptRows = allAppts.map(a => ({
        startsAt:    a.startsAt,
        endsAt:      a.endsAt,
        status:      a.status,
        priceCents:  a.priceCents,
        serviceId:   a.serviceId,
        customerId:  a.customerId ?? a.guestEmail ?? 'guest',
      }));

      const statsToday   = computeBarberStats(apptRows.filter(a => a.startsAt >= startOfToday && a.startsAt <= endOfToday),   services, barber.commissionPct);
      const statsWeek    = computeBarberStats(apptRows.filter(a => a.startsAt >= startOfWeek  && a.startsAt <= endOfWeek),    services, barber.commissionPct);
      const statsMonth   = computeBarberStats(apptRows.filter(a => a.startsAt >= startOfMonth && a.startsAt <= endOfMonth),   services, barber.commissionPct);
      const statsAll     = computeBarberStats(apptRows, services, barber.commissionPct);

      const topSvc = topServices(apptRows.filter(a => a.startsAt >= startOfMonth && a.startsAt <= endOfMonth), services, 5);

      // Agenda de hoje: todos os appointments do dia com nome do servico
      const todayAppts = apptRows
        .filter(a => a.startsAt >= startOfToday && a.startsAt <= endOfToday)
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
        .map(a => {
          const svc = services.find(s => s.id === a.serviceId);
          return {
            id:        `${a.serviceId}-${a.startsAt.getTime()}`, // chave local
            time:      `${String(a.startsAt.getHours()).padStart(2, '0')}:${String(a.startsAt.getMinutes()).padStart(2, '0')}`,
            status:    a.status,
            priceCents: a.priceCents,
            serviceName: svc?.name ?? '—',
            customerId: a.customerId,
            isGuest:    !apptRows.some(x => x.customerId === a.customerId),
          };
        });

      return reply.send({
        barber: {
          id: barber.id,
          initials: barber.initials,
          specialty: barber.specialty,
          commissionPct: barber.commissionPct,
        },
        stats: {
          today: statsToday,
          week:  statsWeek,
          month: statsMonth,
          allTime: statsAll,
        },
        todayAppointments: todayAppts,
        topServices: topSvc.map(t => ({
          name:           t.service.name,
          count:          t.count,
          revenueCents:   t.revenueCents,
          durationLabel:  formatMinutes(t.service.durationMin),
        })),
        formattedDuration: {
          today: formatMinutes(statsToday.totalDurationMin),
          week:  formatMinutes(statsWeek.totalDurationMin),
          month: formatMinutes(statsMonth.totalDurationMin),
        },
      });
    });
  });
}
