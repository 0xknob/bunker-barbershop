// Testes das funções puras do dashboard do profissional.
// Roda com: pnpm --filter @barbearia-retro/api test

import { describe, it, expect } from 'vitest';
import { computeBarberStats, appointmentsInRange, topServices, formatMinutes } from './barber-stats';

describe('barber-stats', () => {
  const services = [
    { id: 's1', name: 'Corte', durationMin: 30 },
    { id: 's2', name: 'Barba', durationMin: 30 },
    { id: 's3', name: 'Combo', durationMin: 60 },
  ];

  describe('computeBarberStats', () => {
    it('zera tudo quando lista vazia', () => {
      const stats = computeBarberStats([], services, 5000);
      expect(stats.completedCount).toBe(0);
      expect(stats.totalRevenueCents).toBe(0);
      expect(stats.commissionCents).toBe(0);
      expect(stats.averageTicketCents).toBe(0);
    });

    it('conta só COMPLETED pra receita e comissão', () => {
      const apps = [
        { startsAt: new Date(), endsAt: new Date(), status: 'COMPLETED', priceCents: 5000, serviceId: 's1', customerId: 'c1' },
        { startsAt: new Date(), endsAt: new Date(), status: 'CANCELLED', priceCents: 9999, serviceId: 's2', customerId: 'c2' },
        { startsAt: new Date(), endsAt: new Date(), status: 'NO_SHOW',   priceCents: 9999, serviceId: 's3', customerId: 'c3' },
        { startsAt: new Date(), endsAt: new Date(), status: 'PENDING',   priceCents: 9999, serviceId: 's1', customerId: 'c4' },
      ];
      const stats = computeBarberStats(apps, services, 5000);
      expect(stats.completedCount).toBe(1);
      expect(stats.totalRevenueCents).toBe(5000);
      expect(stats.commissionCents).toBe(2500); // 50% de 5000
    });

    it('conta cancelled e noShow separados', () => {
      const apps = [
        { startsAt: new Date(), endsAt: new Date(), status: 'CANCELLED', priceCents: 1000, serviceId: 's1', customerId: 'c1' },
        { startsAt: new Date(), endsAt: new Date(), status: 'NO_SHOW',   priceCents: 1000, serviceId: 's1', customerId: 'c2' },
        { startsAt: new Date(), endsAt: new Date(), status: 'COMPLETED', priceCents: 1000, serviceId: 's1', customerId: 'c3' },
      ];
      const stats = computeBarberStats(apps, services, 5000);
      expect(stats.cancelledCount).toBe(1);
      expect(stats.noShowCount).toBe(1);
      expect(stats.completedCount).toBe(1);
    });

    it('calcula duração total em minutos', () => {
      const apps = [
        { startsAt: new Date(), endsAt: new Date(), status: 'COMPLETED', priceCents: 1000, serviceId: 's1', customerId: 'c1' }, // 30min
        { startsAt: new Date(), endsAt: new Date(), status: 'COMPLETED', priceCents: 1000, serviceId: 's3', customerId: 'c2' }, // 60min
      ];
      const stats = computeBarberStats(apps, services, 5000);
      expect(stats.totalDurationMin).toBe(90);
    });

    it('calcula ticket médio corretamente', () => {
      const apps = [
        { startsAt: new Date(), endsAt: new Date(), status: 'COMPLETED', priceCents: 3000, serviceId: 's1', customerId: 'c1' },
        { startsAt: new Date(), endsAt: new Date(), status: 'COMPLETED', priceCents: 5000, serviceId: 's2', customerId: 'c2' },
      ];
      const stats = computeBarberStats(apps, services, 5000);
      expect(stats.totalRevenueCents).toBe(8000);
      expect(stats.averageTicketCents).toBe(4000); // 8000 / 2
    });

    it('ticket médio é 0 se nada completo (evita NaN)', () => {
      const apps = [
        { startsAt: new Date(), endsAt: new Date(), status: 'CANCELLED', priceCents: 9999, serviceId: 's1', customerId: 'c1' },
      ];
      const stats = computeBarberStats(apps, services, 5000);
      expect(stats.averageTicketCents).toBe(0);
    });

    it('calcula comissão com basis points (4500 = 45%)', () => {
      const apps = [
        { startsAt: new Date(), endsAt: new Date(), status: 'COMPLETED', priceCents: 10000, serviceId: 's1', customerId: 'c1' },
      ];
      const stats = computeBarberStats(apps, services, 4500);
      expect(stats.commissionCents).toBe(4500); // 45% de 10000
    });
  });

  describe('appointmentsInRange', () => {
    const baseDate = new Date('2026-08-16T00:00:00Z');
    it('inclui nas pontas (inclusivo)', () => {
      const apps = [
        { startsAt: baseDate, endsAt: baseDate, status: 'COMPLETED', priceCents: 1000, serviceId: 's1', customerId: 'c1' },
        { startsAt: new Date('2026-08-16T23:59:00Z'), endsAt: new Date('2026-08-16T23:59:00Z'), status: 'COMPLETED', priceCents: 1000, serviceId: 's1', customerId: 'c2' },
        { startsAt: new Date('2026-08-17T00:00:01Z'), endsAt: new Date('2026-08-17T00:00:01Z'), status: 'COMPLETED', priceCents: 1000, serviceId: 's1', customerId: 'c3' },
      ];
      const inRange = appointmentsInRange(apps, baseDate, new Date('2026-08-16T23:59:00Z'));
      expect(inRange).toHaveLength(2);
    });
  });

  describe('topServices', () => {
    it('ranking ordenado por frequência', () => {
      const apps = [
        { startsAt: new Date(), endsAt: new Date(), status: 'COMPLETED', priceCents: 1000, serviceId: 's1', customerId: 'c1' },
        { startsAt: new Date(), endsAt: new Date(), status: 'COMPLETED', priceCents: 1000, serviceId: 's1', customerId: 'c2' },
        { startsAt: new Date(), endsAt: new Date(), status: 'COMPLETED', priceCents: 1000, serviceId: 's1', customerId: 'c3' },
        { startsAt: new Date(), endsAt: new Date(), status: 'COMPLETED', priceCents: 1000, serviceId: 's2', customerId: 'c4' },
      ];
      const top = topServices(apps, services, 5);
      expect(top[0].service.id).toBe('s1');
      expect(top[0].count).toBe(3);
      expect(top[1].service.id).toBe('s2');
      expect(top[1].count).toBe(1);
    });

    it('respeita o limit', () => {
      const apps = [
        { startsAt: new Date(), endsAt: new Date(), status: 'COMPLETED', priceCents: 1000, serviceId: 's1', customerId: 'c1' },
        { startsAt: new Date(), endsAt: new Date(), status: 'COMPLETED', priceCents: 1000, serviceId: 's2', customerId: 'c2' },
        { startsAt: new Date(), endsAt: new Date(), status: 'COMPLETED', priceCents: 1000, serviceId: 's3', customerId: 'c3' },
      ];
      const top = topServices(apps, services, 2);
      expect(top).toHaveLength(2);
    });

    it('não conta status não-COMPLETED', () => {
      const apps = [
        { startsAt: new Date(), endsAt: new Date(), status: 'CANCELLED', priceCents: 1000, serviceId: 's1', customerId: 'c1' },
        { startsAt: new Date(), endsAt: new Date(), status: 'COMPLETED', priceCents: 1000, serviceId: 's2', customerId: 'c2' },
      ];
      const top = topServices(apps, services, 5);
      expect(top).toHaveLength(1);
      expect(top[0].service.id).toBe('s2');
    });
  });

  describe('formatMinutes', () => {
    it('0 = "0min"', () => {
      expect(formatMinutes(0)).toBe('0min');
    });
    it('< 60 = so minutos', () => {
      expect(formatMinutes(45)).toBe('45min');
    });
    it('multiplo de 60 = so horas', () => {
      expect(formatMinutes(120)).toBe('2h');
    });
    it('com resto = horas + minutos', () => {
      expect(formatMinutes(135)).toBe('2h 15min');
    });
  });
});
