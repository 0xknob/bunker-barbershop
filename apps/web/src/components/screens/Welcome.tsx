// Welcome — janela de boas-vindas com dois botões: agendar ou entrar como admin.
// Primeira coisa que aparece depois do boot. Centralizada no desktop.
import { Window } from '../ui/Window';
import { Button } from '../ui/Button';

interface WelcomeProps {
  onBook: () => void;
  onAdmin: () => void;
}

/**
 * Welcome — "tela inicial" do app.
 * Mantida propositalmente sem imagem: usa emoji pra dar identidade retrô
 * sem precisar carregar assets externos.
 */
export function Welcome({ onBook, onAdmin }: WelcomeProps) {
  return (
    <Window title="BunkerBarbershop — Bem-vindo!">
      <div className="flex gap-4 items-start">
        {/* Ícone grande no estilo "tile" do desktop XP */}
        <div className="shrink-0 w-16 h-16 bg-gradient-to-br from-xp-sky to-xp-skyDark shadow-xpRaised flex items-center justify-center text-[32px]">
          {/* Tesoura como identidade visual */}
          ✂
        </div>

        <div className="min-w-0">
          <h2 className="text-[15px] font-bold mb-2">Olá! Como podemos ajudar?</h2>
          <p className="text-[12px] text-xp-text/80 mb-4">
            Agende seu atendimento em menos de 1 minuto, ou abra o painel do dono
            para gerenciar a agenda do dia.
          </p>

          <div className="flex gap-3">
            <Button variant="primary" onClick={onBook}>
              Quero agendar
            </Button>
            <Button onClick={onAdmin}>Painel do dono</Button>
          </div>
        </div>
      </div>
    </Window>
  );
}
