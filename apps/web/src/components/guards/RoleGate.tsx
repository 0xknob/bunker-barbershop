// RoleGate — esconde children se o user não tem nenhum dos roles listados.
// Diferente do RequireRole (que protege rota), esse é pra blocos inline.

import type { ReactNode } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import type { Role } from '@barbearia-retro/shared';

interface Props {
  roles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ roles, children, fallback = null }: Props) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <>{fallback}</>;
  return <>{children}</>;
}
