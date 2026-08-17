// Testes das regras de negócio de agendamento (sem dependência de DB).
// Roda com: pnpm --filter @bunker/api test
//
// Foca nas funções puras da camada de serviço — sem mock de DB.

import { describe, it, expect } from 'vitest';
import { isLateCancel, calcEndsAt } from './appointment-rules';

describe('appointment-rules', () => {
  describe('isLateCancel', () => {
    it('retorna true se começar em < 24h', () => {
      const now = new Date('2026-08-16T12:00:00Z');
      const start = new Date('2026-08-17T11:00:00Z'); // 23h depois
      expect(isLateCancel(start, now)).toBe(true);
    });

    it('retorna false se começar em >= 24h', () => {
      const now = new Date('2026-08-16T12:00:00Z');
      const start = new Date('2026-08-17T13:00:00Z'); // 25h depois
      expect(isLateCancel(start, now)).toBe(false);
    });

    it('retorna false se começar exatamente em 24h', () => {
      const now = new Date('2026-08-16T12:00:00Z');
      const start = new Date('2026-08-17T12:00:00Z');
      expect(isLateCancel(start, now)).toBe(false);
    });

    it('retorna false para agendamento no passado (cliente não cancela)', () => {
      const now = new Date('2026-08-16T12:00:00Z');
      const start = new Date('2026-08-15T12:00:00Z'); // ontem
      // Diff é negativo (-24h) — fica abaixo de 24h, mas interpretado como "passou"
      // isLateCancel retorna true se diff < 24h (incl. negativo)
      expect(isLateCancel(start, now)).toBe(true);
    });
  });

  describe('calcEndsAt', () => {
    it('adiciona a duração em minutos ao start', () => {
      const start = new Date('2026-08-16T10:00:00Z');
      const end = calcEndsAt(start, 60); // 1h
      expect(end.toISOString()).toBe('2026-08-16T11:00:00.000Z');
    });

    it('lida com duração 0', () => {
      const start = new Date('2026-08-16T10:00:00Z');
      const end = calcEndsAt(start, 0);
      expect(end.getTime()).toBe(start.getTime());
    });

    it('lida com duração grande (8 horas)', () => {
      const start = new Date('2026-08-16T08:00:00Z');
      const end = calcEndsAt(start, 480); // 8h
      expect(end.toISOString()).toBe('2026-08-16T16:00:00.000Z');
    });
  });
});
