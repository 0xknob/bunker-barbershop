// Provider de contexto da CASL ability — popula AbilityContext com a ability
// do usuário. Permite usar `<Can>` e `useAbility` do @casl/react em qualquer
// componente sem precisar passar a ability via props.

import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import { createMongoAbility } from '@casl/ability';
import { createContextualCan } from '@casl/react';
import type { AppAbility } from '@barbearia-retro/shared/ability';
import { useAuth } from '../../auth/AuthProvider';

const AbilityContext = createContext<AppAbility>(createMongoAbility() as AppAbility);

export function AbilityProvider({ children }: { children: ReactNode }) {
  const { ability } = useAuth();
  return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>;
}

/** Hook pra acessar a ability atual em qualquer componente. */
export function useAbility(): AppAbility {
  return useContext(AbilityContext);
}

/** Componente <Can> pré-configurado com o contexto da app. */
export const Can = createContextualCan(AbilityContext.Consumer);
