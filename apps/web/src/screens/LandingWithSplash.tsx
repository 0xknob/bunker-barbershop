// Landing com splash BIOS no primeiro acesso (1x por session).
// Demais acessos pulam direto pra LandingPage.

import { AppSplash } from '../components/AppSplash';
import { LandingPage } from './LandingPage';

export function LandingWithSplash() {
  return (
    <AppSplash>
      <LandingPage />
    </AppSplash>
  );
}
