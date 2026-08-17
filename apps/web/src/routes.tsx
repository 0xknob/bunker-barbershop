// Rotas do React Router 7.
// - /                → LandingPage PÚBLICA (hero, serviços, produtos, contato)
// - /login, /signup  → público
// - /booking         → requer login (qualquer role)
// - /customer        → CUSTOMER
// - /barber          → BARBER
// - /owner           → OWNER
// - /unauthorized    → fallback de role errado

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Login } from './screens/Login';
import { LandingWithSplash } from './screens/LandingWithSplash';
import { Signup } from './screens/Signup';
import { Booking } from './screens/Booking';
import { BookingPublic } from './screens/BookingPublic';
import { ClientPanel } from './screens/ClientPanel';
import { BarberPanel } from './screens/BarberPanel';
import { OwnerPanel } from './screens/OwnerPanel';
import { Unauthorized } from './screens/Unauthorized';
import { RequireRole } from './components/guards/RequireRole';
import { RequireAuth } from './components/guards/RequireAuth';

export const router = createBrowserRouter([
  // Públicas (com splash BIOS no primeiro acesso da sessão)
  { path: '/',              element: <LandingWithSplash /> },
  { path: '/login',         element: <Login /> },
  { path: '/signup',        element: <Signup /> },
  { path: '/booking-public', element: <BookingPublic /> },
  { path: '/unauthorized',  element: <Unauthorized /> },

  // Requer login (qualquer role)
  { path: '/booking', element: <RequireAuth><Booking /></RequireAuth> },

  // Requer login + role específico
  { path: '/customer', element: <RequireRole roles={['CUSTOMER']}><ClientPanel /></RequireRole> },
  { path: '/barber',   element: <RequireRole roles={['BARBER']}><BarberPanel /></RequireRole> },
  { path: '/owner',    element: <RequireRole roles={['OWNER']}><OwnerPanel /></RequireRole> },

  // Fallback
  { path: '*', element: <Navigate to="/" replace /> },
]);
