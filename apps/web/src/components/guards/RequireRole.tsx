// Guard que protege uma rota inteira por role.
// Redireciona pra /login se não autenticado, /unauthorized se role errado.

import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import type { Role } from '@bunker/shared';

interface Props {
  roles: Role[];
  children: ReactNode;
}

export function RequireRole({ roles, children }: Props) {
  const { user, loading } = useAuth();

  if (loading) return null; // splash
  if (!user)   return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;

  return <>{children}</>;
}
