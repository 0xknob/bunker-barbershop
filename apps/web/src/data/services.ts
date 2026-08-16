// Dados mock da barbearia. Em produção viriam de uma API REST/Postgres.
// Mantemos aqui no MVP pra demonstrar o fluxo completo sem backend.

// ─── Serviços ────────────────────────────────────────────────────────────────
export interface Service {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  price: number;
}

export const SERVICES: Service[] = [
  { id: 'svc-corte',     name: 'Corte Clássico',    description: 'Máquina + tesoura, do jeito tradicional.', durationMin: 30, price: 35 },
  { id: 'svc-barba',     name: 'Barba na Toalha',   description: 'Toalha quente, navalha e balm pós.',       durationMin: 30, price: 30 },
  { id: 'svc-combo',     name: 'Combo Corte + Barba', description: 'Pacote completo pra sair alinhado.',    durationMin: 60, price: 60 },
  { id: 'svc-pigmentar', name: 'Pigmentação',       description: 'Disfarce fios brancos com técnica suave.', durationMin: 45, price: 50 },
  { id: 'svc-pacatao',   name: 'Pacotão VIP',       description: 'Corte, barba, hidratação e estilização.', durationMin: 90, price: 110 },
];

// ─── Barbeiros ───────────────────────────────────────────────────────────────
export interface Barber {
  id: string;
  name: string;
  specialty: string;
  initials: string; // usado no "avatar" sem imagem
}

export const BARBERS: Barber[] = [
  { id: 'brb-rui',    name: 'Rui "Mão de Tesoura"', specialty: 'Cortes clássicos e degradê', initials: 'RT' },
  { id: 'brb-carlos', name: 'Carlos Navalha',       specialty: 'Barba e pigmentação',         initials: 'CN' },
  { id: 'brb-tiago',  name: 'Tiago Vintage',        specialty: 'Estilização e combos',        initials: 'TV' },
];

// ─── Geração de horários do dia ──────────────────────────────────────────────
// Slots de 30min das 09:00 às 19:00. Não usamos libs externas pra manter didático.
export function generateSlots(date: Date): string[] {
  const slots: string[] = [];
  for (let h = 9; h < 19; h++) {
    for (const m of [0, 30]) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  // Slots passados do dia ficam indisponíveis automaticamente
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    const hh = now.getHours();
    const mm = now.getMinutes() < 30 ? 0 : 30;
    return slots.filter((s) => {
      const [sh, sm] = s.split(':').map(Number);
      return sh > hh || (sh === hh && sm >= mm);
    });
  }
  return slots;
}
