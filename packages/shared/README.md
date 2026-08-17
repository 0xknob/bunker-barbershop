# `@barbearia-retro/shared`

Tipos, schemas Zod e regras CASL compartilhadas entre front (`apps/web`) e back (`apps/api`).

## Conteúdo

- `Role` — `'OWNER' | 'BARBER' | 'CUSTOMER'`
- `AppointmentStatus` — `'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'`
- `AppAbility` — tipo CASL gerado por `defineAbilityFor(role)`
- `defineAbilityFor` — função pura; mesma lógica front + back

## Uso

```ts
import { defineAbilityFor } from '@barbearia-retro/shared/ability';

const ability = defineAbilityFor('BARBER', { userId: 'abc', tenantId: 'xyz' });
if (ability.can('cancel', { __caslSubjectType__: 'Appointment', customerId: 'abc' })) {
  // pode cancelar
}
```

Build: pnpm build (compila pra `dist/`).
