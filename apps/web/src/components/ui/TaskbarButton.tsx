// Botão da barra de tarefas — estilo "Iniciar" / tarefas do XP.
// Aceita um botão × à direita (onClose) pra fechar a janela individual.

import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface TaskbarButtonProps {
  active?: boolean;
  icon?: ReactNode;
  label: string;
  onClick: () => void;
  onClose?: () => void;
}

/**
 * TaskbarButton — botão "iniciar" usado na barra inferior.
 * Estado `active` deixa visualmente pressionado (XP clássico).
 * Com `onClose`, mostra um × à direita pra fechar a janela.
 */
export function TaskbarButton({
  active,
  icon,
  label,
  onClick,
  onClose,
}: TaskbarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-1 min-w-[120px] group',
        'text-white text-[12px] font-bold',
        // Gradiente XP nas tarefas + sombra elevada
        'bg-gradient-to-b from-xp-taskbarLight to-xp-taskbar',
        active ? 'shadow-xpPressed' : 'shadow-xpRaised',
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate flex-1 text-left">{label}</span>
      {onClose && (
        <span
          role="button"
          tabIndex={0}
          aria-label="Fechar aba"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClose();
            }
          }}
          className="ml-1 px-1 text-[14px] hover:bg-xp-paper/20 rounded"
        >
          ✕
        </span>
      )}
    </button>
  );
}
