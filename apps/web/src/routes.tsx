// Rotas do React Router 7.
// - /login              → tela de login/cadastro (público)
// - /                   → desktop retrô (welcome) — exige login
// - /customer           → painel do cliente (refactor do BookingFlow)
// - /barber             → painel do barbeiro
// - /owner              → painel do dono
// - /unauthorized       → fallback de role errado

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Login } from './screens/Login';
import { Desktop } from './components/screens/Desktop';
import { ClientPanel } from './screens/ClientPanel';
import { BarberPanel } from './screens/BarberPanel';
import { OwnerPanel } from './screens/OwnerPanel';
import { Unauthorized } from './screens/Unauthorized';
import { RequireRole } from './components/guards/RequireRole';

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/unauthorized', element: <Unauthorized /> },

  // Desktop retrô (welcome) — só logado vê
  { path: '/', element: <Desktop /> },

  // Painéis por role
  { path: '/customer', element: <RequireRole roles={['CUSTOMER']}><ClientPanel /></RequireRole> },
  { path: '/barber',   element: <RequireRole roles={['BARBER']}><BarberPanel /></RequireRole> },
  { path: '/owner',    element: <RequireRole roles={['OWNER']}><OwnerPanel /></RequireRole> },

  // Fallback
  { path: '*', element: <Navigate to="/" replace /> },
]);
