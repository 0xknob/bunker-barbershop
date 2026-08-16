import { Window } from '../components/ui/Window';

export function Unauthorized() {
  return (
    <Window title="Acesso negado">
      <p className="text-[12px]">Você não tem permissão pra acessar essa área.</p>
    </Window>
  );
}
