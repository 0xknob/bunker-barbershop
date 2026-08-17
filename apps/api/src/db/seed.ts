// Seed inicial — popula o banco com dados de demonstração.
// Estratégia:
//   1. Cria tenant via Drizzle
//   2. Cria 4 users via Better-Auth API (gera hash de senha)
//   3. Associa cada user ao tenant via user_roles
//   4. Cria barbers/services/appointments referenciando user_id (text)
//
// Senha demo de TODOS os usuários: "bunker1234"
// Nome de cada user = CARGO (não nome pessoal).
//
// Uso: pnpm db:seed
// Idempotente: TRUNCATE CASCADE antes de popular.

import { db, schema } from './client';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

const DEMO_PASSWORD = 'bunker1234';

const USERS = [
  { email: 'owner@bunker.dev',     name: 'Dono' },
  { email: 'barbeiro1@bunker.dev', name: 'Barbeiro 1' },
  { email: 'barbeiro2@bunker.dev', name: 'Barbeiro 2' },
  { email: 'cliente@bunker.dev',  name: 'Cliente' },
] as const;

async function signUpUser(email: string, name: string): Promise<string> {
  const res = await fetch('http://localhost:3001/api/auth/sign-up/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',
    },
    body: JSON.stringify({ email, password: DEMO_PASSWORD, name }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`signUp falhou pra ${email}: ${res.status} ${body}`);
  }
  const data = await res.json();
  return data.user.id as string;
}

async function seed() {
  console.log('🌱 Limpando dados existentes...');
  // CASCADE remove tudo que depende de tenants/users/BA tables.
  await db.execute(sql`TRUNCATE TABLE tenants, "user", "session", "account", "verification" CASCADE`);

  console.log('🌱 Criando tenant BunkerBarbershop...');
  const [tenant] = await db
    .insert(schema.tenants)
    .values({ name: 'BunkerBarbershop', slug: 'bunker-barbershop' })
    .returning();
  if (!tenant) throw new Error('Falha ao criar tenant');

  console.log('🌱 Criando usuários via Better-Auth (gera hash de senha)...');
  const userIds: Record<string, string> = {};
  for (const u of USERS) {
    const id = await signUpUser(u.email, u.name);
    userIds[u.email] = id;
    console.log(`   ✓ ${u.email} (${u.name}) → ${id}`);
  }

  console.log('🌱 Criando roles (RBAC)...');
  await db.insert(schema.userRoles).values([
    { userId: userIds['owner@bunker.dev']!,      tenantId: tenant.id, role: 'OWNER' },
    { userId: userIds['barbeiro1@bunker.dev']!, tenantId: tenant.id, role: 'BARBER' },
    { userId: userIds['barbeiro2@bunker.dev']!, tenantId: tenant.id, role: 'BARBER' },
    { userId: userIds['cliente@bunker.dev']!,   tenantId: tenant.id, role: 'CUSTOMER' },
  ]);

  console.log('🌱 Criando perfis de barbeiro...');
  const [brb1, brb2] = await db
    .insert(schema.barbers)
    .values([
      { id: randomUUID(), userId: userIds['barbeiro1@bunker.dev']!, tenantId: tenant.id, specialty: 'Cortes clássicos', initials: 'B1', commissionPct: 5000 },
      { id: randomUUID(), userId: userIds['barbeiro2@bunker.dev']!, tenantId: tenant.id, specialty: 'Barba e pigmentação', initials: 'B2', commissionPct: 4500 },
    ])
    .returning();
  if (!brb1 || !brb2) throw new Error('Falha ao criar barbeiros');

  console.log('🌱 Criando catálogo de serviços...');
  const services = await db
    .insert(schema.services)
    .values([
      { id: randomUUID(), tenantId: tenant.id, name: 'Corte Clássico',      description: 'Máquina + tesoura',           durationMin: 30, bookingIntervalMin: 30, bufferMin: 15, priceCents: 3500 },
      { id: randomUUID(), tenantId: tenant.id, name: 'Barba na Toalha',     description: 'Toalha quente + navalha',     durationMin: 30, bookingIntervalMin: 30, bufferMin: 15, priceCents: 3000 },
      { id: randomUUID(), tenantId: tenant.id, name: 'Combo Corte + Barba', description: 'Pacote completo',             durationMin: 60, bookingIntervalMin: 30, bufferMin: 15, priceCents: 6000 },
      { id: randomUUID(), tenantId: tenant.id, name: 'Pigmentação',         description: 'Disfarce fios brancos',       durationMin: 45, bookingIntervalMin: 30, bufferMin: 15, priceCents: 5000 },
      { id: randomUUID(), tenantId: tenant.id, name: 'Pacotão VIP',         description: 'Corte + barba + hidratação',  durationMin: 90, bookingIntervalMin: 60, bufferMin: 15, priceCents: 11000 },
    ])
    .returning();
  const svcCombo = services.find(s => s.name === 'Combo Corte + Barba')!;
  const svcCorte = services.find(s => s.name === 'Corte Clássico')!;

  console.log('🌱 Criando agendamentos de exemplo...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  await db.insert(schema.appointments).values([
    {
      id:         randomUUID(),
      tenantId:   tenant.id,
      customerId: userIds['cliente@bunker.dev']!,
      barberId:   brb1.id,
      serviceId:  svcCombo.id,
      startsAt:   tomorrow,
      endsAt:     new Date(tomorrow.getTime() + 60 * 60_000),
      priceCents: svcCombo.priceCents,
      status:     'CONFIRMED',
    },
    {
      id:         randomUUID(),
      tenantId:   tenant.id,
      customerId: userIds['cliente@bunker.dev']!,
      barberId:   brb2.id,
      serviceId:  svcCorte.id,
      startsAt:   new Date(tomorrow.getTime() + 2 * 60 * 60_000),
      endsAt:     new Date(tomorrow.getTime() + 2 * 60 * 60_000 + 30 * 60_000),
      priceCents: svcCorte.priceCents,
      status:     'PENDING',
    },
  ]);

  console.log('');
  console.log('✅ Seed concluído!\n');
  console.log('📧 Logins (senha de todos: bunker1234):');
  console.log('   OWNER    → owner@bunker.dev');
  console.log('   BARBER 1 → barbeiro1@bunker.dev');
  console.log('   BARBER 2 → barbeiro2@bunker.dev');
  console.log('   CUSTOMER → cliente@bunker.dev');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed falhou:', err);
    process.exit(1);
  });
