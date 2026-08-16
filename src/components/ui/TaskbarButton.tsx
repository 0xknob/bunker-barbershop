// Botão da barra de tarefas — estilo "Iniciar" / tarefas do XP.
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface TaskbarButtonProps {
  active?: boolean;
  icon?: ReactNode;
  label: string;
  onClick: () => void;
}

/**
 * TaskbarButton — botão "iniciar" usado na barra inferior.
 * Estado `active` deixa visualmente pressionado (XP clássico).
 */
export function TaskbarButton({
  active,
  icon,
  label,
  onClick,
}: TaskbarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-1 min-w-[120px]',
        'text-white text-[12px] font-bold',
        // Gradiente XP nas tarefas + sombra elevada
        'bg-gradient-to-b from-xp-taskbarLight to-xp-taskbar',
        active ? 'shadow-xpPressed' : 'shadow-xpRaised',
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{label}</span>
    </button>
  );
}
