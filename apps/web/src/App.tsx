import type { ReactNode } from 'react';
import { BIOSBootScreen } from './components/screens/BIOSBootScreen';
import { Desktop } from './components/screens/Desktop';
import { useAuth } from './auth/AuthProvider';
import { useState } from 'react';

// App agora decide: BIOS Boot (uma vez) → se logado, Desktop; senão, redireciona pro login via rota
export default function App({ children }: { children?: ReactNode }) {
  const [phase, setPhase] = useState<'boot' | 'app'>('boot');
  const { loading, user } = useAuth();

  if (phase === 'boot') return <BIOSBootScreen onComplete={() => setPhase('app')} />;
  if (loading)         return null;
  if (!user)           return null; // rotas públicas (/login) renderizam por fora

  return <Desktop />;
}
