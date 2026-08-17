// AppSplash — wrapper que toca o BIOS Boot Screen na primeira vez que
// o visitante abre a landing page. Se ele já viu (sessão), pula.
// Em desktop retrô a nostalgia vale; em uso frequente fica chato.
//
// Decisao: usamos sessionStorage em vez de localStorage pra nao persistir
// entre sessoes (so dentro da mesma janela/aba).

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { BIOSBootScreen } from '../components/screens/BIOSBootScreen';

const SESSION_KEY = 'bunker:boot-seen';

export function AppSplash({ children }: { children: ReactNode }) {
  const [showBoot, setShowBoot] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) !== '1';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!showBoot) return;
    // A BIOSBootScreen chama onComplete() quando terminar a sequencia de POST
  }, [showBoot]);

  function handleComplete() {
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // sessionStorage indisponivel — ok, vai mostrar de novo na proxima
    }
    setShowBoot(false);
  }

  if (showBoot) {
    return <BIOSBootScreen onComplete={handleComplete} />;
  }
  return <>{children}</>;
}
