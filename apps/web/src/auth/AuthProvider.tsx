// AuthProvider — contexto React que guarda a sessão atual e expõe:
// - user: dados do usuário autenticado (id, email, name, tenantId, role)
// - ability: instância CASL com regras de autorização
// - signIn, signUp, signOut: wrappers sobre Better-Auth client
//
// O fetch é feito em /api/auth/* do nosso backend (configurado em vite.config.ts como proxy).

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authClient } from './auth-client';
import { defineAbilityFor, type AppAbility } from '@bunker/shared/ability';

export type Role = 'OWNER' | 'BARBER' | 'CUSTOMER';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: Role;
}

interface AuthContextValue {
  user: SessionUser | null;
  ability: AppAbility;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Busca sessão ao montar
  useEffect(() => {
    authClient.getSession()
      .then(async (session) => {
        if (session?.data?.user) {
          // Pega role + tenantId via /api/auth/whoami (lê da nossa tabela user_roles)
          const res = await fetch('/api/auth/whoami', { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            setUser({
              id:       data.id,
              email:    data.email,
              name:     data.name,
              tenantId: data.tenantId ?? '',
              role:     data.role ?? 'CUSTOMER',
            });
            return;
          }
          // Fallback se whoami falhar — usuário logado mas sem role conhecido
          setUser({
            id:       session.data.user.id,
            email:    session.data.user.email,
            name:     session.data.user.name,
            tenantId: '',
            role:     'CUSTOMER',
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const ability = useMemo(
    () => defineAbilityFor(user?.role ?? 'CUSTOMER', { userId: user?.id, tenantId: user?.tenantId }),
    [user],
  );

  async function signIn(email: string, password: string) {
    const { error } = await authClient.signIn.email({ email, password });
    if (error) throw new Error(error.message ?? 'Falha no login');
    // Pega dados completos (role + tenantId) via /api/auth/whoami
    const res = await fetch('/api/auth/whoami', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setUser({
        id:       data.id,
        email:    data.email,
        name:     data.name,
        tenantId: data.tenantId ?? '',
        role:     data.role ?? 'CUSTOMER',
      });
    }
  }

  async function signUp(email: string, password: string, name: string, phone = '') {
    const { error } = await authClient.signUp.email({
      email,
      password,
      name,
      // BA additionalFields: exposto no JWT/session se o servidor permitir
      ...(phone ? { phone } : {}),
    });
    if (error) throw new Error(error.message ?? 'Falha no cadastro');
    await signIn(email, password);
  }

  async function signOut() {
    await authClient.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ability, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
