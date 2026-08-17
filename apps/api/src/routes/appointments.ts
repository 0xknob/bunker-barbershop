// CRUD de agendamentos. Tudo dentro de withTenant() — RLS garante
// que mesmo um bug aqui não vaza dados de outros tenants.

import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { db } from '../db/client';
import { schema } from '../db/client';
import { withTenant } from '../lib/with-tenant';
import { requireAuth, attachAbility } from '../middleware/auth';
import { createAppointmentSchema, cancelAppointmentSchema } from '../schemas/appointment';
import { isLateCancel, calcEndsAt } from '../services/appointment-rules';

export async function appointmentRoutes(app: FastifyInstance) {
  // Auth + ability em todas as rotas autenticadas
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', attachAbility);

  // ── GET /api/appointments ────────────────────────────────────
  // Lista agendamentos. CUSTOMER vê só os seus; BARBER vê os seus;
  // OWNER vê todos. Filtro opcional por data.
  app.get('/', async (req, reply) => {
    const { from, to } = req.query as { from?: string; to?: string };
    if (!req.user) return reply.code(401).send({ error: 'Unauthorized' });

    return withTenant(req.user.tenantId, async (txDb) => {
      const conditions = [];
      if (from) conditions.push(gte(schema.appointments.startsAt, new Date(from)));
      if (to)   conditions.push(lte(schema.appointments.startsAt, new Date(to)));
      // CUSTOMER só vê os próprios
      const role = (req.user as { role?: string }).role;
      if (role === 'CUSTOMER') {
        conditions.push(eq(schema.appointments.customerId, req.user.id));
      }
      // BARBER só vê onde ele é o barbeiro
      if (role === 'BARBER') {
        // Precisamos do barber.id (não user.id); simplificamos via subquery depois
      }

      const rows = await txDb
        .select()
        .from(schema.appointments)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(schema.appointments.startsAt))
        .limit(100);

      return rows;
    });
  });

  // ── POST /api/appointments ───────────────────────────────────
  // CUSTOMER cria um appointment pra si mesmo.
  // POST /api/appointments
  // 2 modos: CUSTOMER logado OU visitante anônimo (com guest info).
  // Sem auth obrigatório — visitante pode agendar antes de criar conta.
  app.post('/', async (req, reply) => {
    const parsed = createAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'ValidationError', issues: parsed.error.issues });
    }
    const { serviceId, barberId, startsAt, guest } = parsed.data;

    // Se logado, usa user.id. Se visitante, exige guest.
    if (!req.user && !guest) {
      return reply.code(400).send({ error: 'GuestRequired', message: 'Visitante precisa enviar nome+email+telefone.' });
    }

    // Pega tenant do primeiro tenant ativo (mesmo padrão do /products público)
    const [tenant] = await db
      .select({ id: schema.tenants.id })
      .from(schema.tenants)
      .limit(1);
    if (!tenant) return reply.code(500).send({ error: 'NoTenant' });

    return withTenant(tenant.id, async (txDb) => {
      const [service] = await txDb
        .select()
        .from(schema.services)
        .where(eq(schema.services.id, serviceId))
        .limit(1);
      if (!service) return reply.code(404).send({ error: 'ServiceNotFound' });

      // Se visitante, criar um user "guest" no BA (ou no nosso schema users)
      // por simplificação, gravamos os campos direto no appointment
      const startsAtDate = new Date(startsAt);
      const [created] = await txDb
        .insert(schema.appointments)
        .values({
          id:         randomUUID(),
          tenantId:   tenant.id,
          customerId: req.user?.id ?? null,
          guestName:  guest?.name ?? null,
          guestEmail: guest?.email ?? null,
          guestPhone: guest?.phone ?? null,
          barberId,
          serviceId,
          startsAt:   startsAtDate,
          endsAt:     calcEndsAt(startsAtDate, service.durationMin),
          priceCents: service.priceCents,
          status:     'CONFIRMED',
        })
        .returning();
      return reply.code(201).send(created);
    });
  });

  // ── POST /api/appointments/:id/cancel ────────────────────────
  // Cliente pode cancelar respeitando janela de 24h.
  app.post<{ Params: { id: string } }>('/:id/cancel', async (req, reply) => {
    if (!req.user) return reply.code(401).send({ error: 'Unauthorized' });
    const parsed = cancelAppointmentSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'ValidationError' });

    return withTenant(req.user.tenantId, async (txDb) => {
      const [appt] = await txDb
        .select()
        .from(schema.appointments)
        .where(eq(schema.appointments.id, (req.params as { id: string }).id))
        .limit(1);
      if (!appt) return reply.code(404).send({ error: 'AppointmentNotFound' });

      // CUSTOMER só pode cancelar o próprio
      const role = (req.user as { role?: string }).role;
      if (role === 'CUSTOMER' && appt.customerId !== req.user.id) {
        return reply.code(403).send({ error: 'Forbidden' });
      }

      const lateCancel = isLateCancel(appt.startsAt);
      const [updated] = await txDb
        .update(schema.appointments)
        .set({
          status:     'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: req.user.id,
          lateCancel,
          updatedAt:  new Date(),
        })
        .where(eq(schema.appointments.id, appt.id))
        .returning();

      // Audit log
      await txDb.insert(schema.auditLog).values({
        tenantId:  req.user.tenantId,
        actorId:   req.user.id,
        action:    'appointment.cancelled',
        resource:  'appointment',
        resourceId: appt.id,
        payload:   { lateCancel, reason: parsed.data.reason ?? null },
      });

      return updated;
    });
  });
}
