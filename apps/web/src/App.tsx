// App raiz: controla a transição entre a tela de boot e o desktop.
// Esse é o único lugar que precisa saber da máquina de estados de inicialização.
import { useState } from 'react';
import { BIOSBootScreen } from './components/screens/BIOSBootScreen';
import { Desktop } from './components/screens/Desktop';

type Phase = 'boot' | 'desktop';

export default function App() {
  const [phase, setPhase] = useState<Phase>('boot');

  return phase === 'boot' ? (
    <BIOSBootScreen onComplete={() => setPhase('desktop')} />
  ) : (
    <Desktop />
  );
}
