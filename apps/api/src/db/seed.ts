// Seed inicial — popula o banco com dados de demonstração.
// Cria: 1 tenant (BunkerBarbershop), 3 usuários com roles diferentes,
// 5 serviços, 3 barbeiros, 2 agendamentos de exemplo.
//
// Uso: pnpm db:seed
// Idempotente: limpa tenants/users antes de popular (CASCADE).

import { db, schema } from './client';
import { sql } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Limpando dados existentes...');
  // CASCADE remove tudo que depende de tenants/users.
  await db.execute(sql`TRUNCATE TABLE tenants, users CASCADE`);

  console.log('🌱 Criando tenant BunkerBarbershop...');
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      name: 'BunkerBarbershop',
      slug: 'bunker-barbershop',
    })
    .returning();
  if (!tenant) throw new Error('Falha ao criar tenant');

  console.log('🌱 Criando usuários...');
  const [owner, barber1, barber2, customer] = await db
    .insert(schema.users)
    .values([
      { email: 'rui@bunker.dev',     name: 'Rui Mão de Tesoura',  tenantId: tenant.id },
      { email: 'carlos@bunker.dev',  name: 'Carlos Navalha',      tenantId: tenant.id },
      { email: 'tiago@bunker.dev',   name: 'Tiago Vintage',       tenantId: tenant.id },
      { email: 'cliente@example.com', name: 'João Cliente',       tenantId: tenant.id },
    ])
    .returning();
  if (!owner || !barber1 || !barber2 || !customer) throw new Error('Falha ao criar usuários');

  console.log('🌱 Criando roles (RBAC)...');
  await db.insert(schema.userRoles).values([
    { userId: owner.id,    tenantId: tenant.id, role: 'OWNER' },
    { userId: barber1.id,  tenantId: tenant.id, role: 'BARBER' },
    { userId: barber2.id,  tenantId: tenant.id, role: 'BARBER' },
    { userId: customer.id, tenantId: tenant.id, role: 'CUSTOMER' },
  ]);

  console.log('🌱 Criando perfis de barbeiro...');
  const [brb1, brb2] = await db
    .insert(schema.barbers)
    .values([
      { userId: barber1.id, tenantId: tenant.id, specialty: 'Cortes clássicos', initials: 'RT', commissionPct: 5000 },
      { userId: barber2.id, tenantId: tenant.id, specialty: 'Barba e pigmentação', initials: 'CN', commissionPct: 4500 },
    ])
    .returning();
  if (!brb1 || !brb2) throw new Error('Falha ao criar barbeiros');

  console.log('🌱 Criando catálogo de serviços...');
  const [svcCombo, svcCorte] = await db
    .insert(schema.services)
    .values([
      { tenantId: tenant.id, name: 'Corte Clássico', description: 'Máquina + tesoura', durationMin: 30, bookingIntervalMin: 30, bufferMin: 15, priceCents: 3500 },
      { tenantId: tenant.id, name: 'Barba na Toalha', description: 'Toalha quente + navalha', durationMin: 30, bookingIntervalMin: 30, bufferMin: 15, priceCents: 3000 },
      { tenantId: tenant.id, name: 'Combo Corte + Barba', description: 'Pacote completo', durationMin: 60, bookingIntervalMin: 30, bufferMin: 15, priceCents: 6000 },
      { tenantId: tenant.id, name: 'Pigmentação', description: 'Disfarce fios brancos', durationMin: 45, bookingIntervalMin: 30, bufferMin: 15, priceCents: 5000 },
      { tenantId: tenant.id, name: 'Pacotão VIP', description: 'Corte + barba + hidratação', durationMin: 90, bookingIntervalMin: 60, bufferMin: 15, priceCents: 11000 },
    ])
    .returning();
  if (!svcCombo || !svcCorte) throw new Error('Falha ao criar serviços');

  console.log('🌱 Criando agendamento de exemplo...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  await db.insert(schema.appointments).values({
    tenantId:   tenant.id,
    customerId: customer.id,
    barberId:   brb1.id,
    serviceId:  svcCombo.id,
    startsAt:   tomorrow,
    endsAt:     new Date(tomorrow.getTime() + 60 * 60_000),
    priceCents: svcCombo.priceCents,
    status:     'CONFIRMED',
  });

  console.log('✅ Seed concluído!\n');
  console.log('Login:');
  console.log('  OWNER:    rui@bunker.dev');
  console.log('  BARBER:   carlos@bunker.dev / tiago@bunker.dev');
  console.log('  CUSTOMER: cliente@example.com');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed falhou:', err);
    process.exit(1);
  });
