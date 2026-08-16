// Barra de título clássica do Windows XP.
// Gradiente azul + texto branco + sombra interna sutil nos botões.
// Aceita um "ícone" opcional e ações (min/close) opcionais.
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface TitleBarProps {
  title: string;
  icon?: ReactNode;
  onClose?: () => void;
  className?: string;
}

/**
 * TitleBar — faixa superior das janelas no estilo XP.
 * Renderiza o título em branco sobre gradiente azul e um botão de fechar
 * no canto direito quando `onClose` é informado.
 */
export function TitleBar({ title, icon, onClose, className }: TitleBarProps) {
  return (
    <div
      className={cn(
        // Gradiente vertical clássico do XP: azul claro -> azul escuro
        'flex items-center justify-between px-2 py-1',
        'bg-gradient-to-b from-xp-sky to-xp-skyDark',
        'text-white text-[13px] font-bold select-none',
        className,
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="truncate">{title}</span>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          aria-label="Fechar"
          className={cn(
            'w-5 h-5 flex items-center justify-center',
            // Botão quadrado com bordas elevadas (mesmo padrão de chrome XP)
            'bg-xp-paper text-black text-[11px] leading-none',
            'shadow-xpRaised active:shadow-xpPressed',
          )}
        >
          {/* X em unicode pra não depender de fonte de ícone */}
          ✕
        </button>
      )}
    </div>
  );
}
