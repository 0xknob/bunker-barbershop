// Rotas do React Router 7.
// - /                         → LandingPage PÚBLICA (catálogo + CTAs)
// - /login                    → tela de login
// - /signup                   → tela de cadastro
// - /booking                  → wizard de agendamento (requer login CUSTOMER)
// - /customer                 → painel do cliente
// - /barber                   → painel do barbeiro
// - /owner                    → painel do dono
// - /unauthorized             → fallback de role errado

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Login } from './screens/Login';
import { LandingPage } from './screens/LandingPage';
import { Signup } from './screens/Signup';
import { Desktop } from './components/screens/Desktop';
import { ClientPanel } from './screens/ClientPanel';
import { BarberPanel } from './screens/BarberPanel';
import { OwnerPanel } from './screens/OwnerPanel';
import { Unauthorized } from './screens/Unauthorized';
import { RequireRole } from './components/guards/RequireRole';

export const router = createBrowserRouter([
  // Públicas
  { path: '/',             element: <LandingPage /> },
  { path: '/login',        element: <Login /> },
  { path: '/signup',       element: <Signup /> },
  { path: '/unauthorized', element: <Unauthorized /> },

  // Desktop retrô (welcome) — só logado (legado)
  { path: '/desktop',      element: <Desktop /> },

  // Painéis por role (requer login + role específico)
  { path: '/customer',     element: <RequireRole roles={['CUSTOMER']}><ClientPanel /></RequireRole> },
  { path: '/barber',       element: <RequireRole roles={['BARBER']}><BarberPanel /></RequireRole> },
  { path: '/owner',        element: <RequireRole roles={['OWNER']}><OwnerPanel /></RequireRole> },

  // Fallback
  { path: '*',             element: <Navigate to="/" replace /> },
]);
