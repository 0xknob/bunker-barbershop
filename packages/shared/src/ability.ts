// CASL ability — compartilhado entre front (@casl/react) e back (@casl/ability).
// Mesma lógica garante consistência das regras em ambos os lados.

import { AbilityBuilder, createMongoAbility, type MongoAbility } from '@casl/ability';

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'cancel' | 'manage';
export type Subjects =
  | 'Appointment'
  | 'Service'
  | 'Barber'
  | 'User'
  | 'Report'
  | 'all';

export type AppAbility = MongoAbility<[Actions, Subjects]>;

export type Role = 'OWNER' | 'BARBER' | 'CUSTOMER';

export function defineAbilityFor(role: Role, opts?: { userId?: string; tenantId?: string }): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  const cb = can as any; // workaround: CASL v6 generic narrowing atrapalha TS

  if (role === 'OWNER') {
    can('manage', 'all');
  }
  if (role === 'BARBER') {
    can(['read', 'create', 'update', 'cancel'], 'Appointment');
    can('read', 'Service');
    can('read', 'Barber');
    cb('update', 'Barber', { userId: opts?.userId });
    cb('read', 'Report', { scope: 'self' });
  }
  if (role === 'CUSTOMER') {
    can(['read', 'create'], 'Service');
    cb(['read', 'cancel'], 'Appointment', { customerId: opts?.userId });
  }
  return build();
}
