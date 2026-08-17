// Guard que exige login mas não checa role — qualquer um dos 3 roles passa.
// Redireciona pra /login se não autenticado.

import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';

interface Props {
  children: ReactNode;
}

export function RequireAuth({ children }: Props) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user)   return <Navigate to="/login" replace />;

  return <>{children}</>;
}
