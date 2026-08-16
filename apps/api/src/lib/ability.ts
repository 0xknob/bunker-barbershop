// CASL ability — modela regras de autorização por role + ownership.
// Mesma lógica usada no front (`@casl/react` no commit 16) e no back
// (aqui), garantindo consistência.
//
// Doc: https://casl.js.org/v7/en/package/casl-ability

import { AbilityBuilder, createMongoAbility, type MongoAbility } from '@casl/ability';
import type { Role } from '../db/schema/user-roles';

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'cancel' | 'manage';
export type Subjects =
  | 'Appointment'
  | 'Service'
  | 'Barber'
  | 'User'
  | 'Report'
  | 'all';

export type AppAbility = MongoAbility<[Actions, Subjects]>;

export function defineAbilityFor(role: Role, opts?: { userId?: string; tenantId?: string }) {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  // OWNER pode tudo dentro do tenant
  if (role === 'OWNER') {
    can('manage', 'all');
  }

  // BARBER pode ver/criar appointments e bloquear agenda
  if (role === 'BARBER') {
    can(['read', 'create', 'update', 'cancel'], 'Appointment');
    can('read', 'Service');
    can('read', 'Barber');
    // só pode editar o próprio perfil de barbeiro
    can('update', 'Barber', { userId: opts?.userId });
    // vê relatórios só do próprio desempenho
    can('read', 'Report', { scope: 'self' });
  }

  // CUSTOMER pode criar/ler/cancelar os próprios appointments
  if (role === 'CUSTOMER') {
    can(['read', 'create'], 'Service');
    can(['read', 'cancel'], 'Appointment', { customerId: opts?.userId });
  }

  return build();
}
