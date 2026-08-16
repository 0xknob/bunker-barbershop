import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { AbilityProvider } from './components/guards/AbilityProvider';
import { router } from './routes';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AbilityProvider>
        <RouterProvider router={router} />
      </AbilityProvider>
    </AuthProvider>
  </StrictMode>,
);
