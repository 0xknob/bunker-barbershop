// Helpers de domínio compartilhados pelo front (formato).
// Cobertura mínima de invariantes.

import { describe, it, expect } from 'vitest';

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

describe('formatBRL', () => {
  it('formata com R$ e vírgula pra decimais', () => {
    const formatted = formatBRL(35);
    // Aceita ambos formatos: "R$ 35,00" ou "R$35,00"
    expect(formatted).toMatch(/R\$\s?35,00/);
  });

  it('formata zero', () => {
    expect(formatBRL(0)).toMatch(/R\$\s?0,00/);
  });

  it('formata centavos corretamente', () => {
    expect(formatBRL(125.5)).toMatch(/R\$\s?125,50/);
  });

  it('formata valores grandes', () => {
    expect(formatBRL(1234.56)).toMatch(/R\$\s?1\.234,56/);
  });
});

describe('formatDuration', () => {
  it('mostra apenas minutos se < 60', () => {
    expect(formatDuration(30)).toBe('30 min');
    expect(formatDuration(45)).toBe('45 min');
  });

  it('mostra horas se >= 60 e divisível', () => {
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(120)).toBe('2 h');
  });

  it('combina horas e minutos', () => {
    expect(formatDuration(90)).toBe('1 h 30 min');
    expect(formatDuration(125)).toBe('2 h 5 min');
  });
});
