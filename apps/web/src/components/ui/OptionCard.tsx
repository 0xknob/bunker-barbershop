// Card selecionável — usado pra listar serviços e barbeiros.
// Estado selecionado: borda azul mais grossa + leve fundo azul.
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
}

/**
 * OptionCard — bloco clicável estilo "tile" do XP.
 * O "selecionado" é comunicado por borda azul externa (sem mudar layout).
 */
export function OptionCard({
  selected,
  onClick,
  title,
  subtitle,
  badge,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 mb-2 bg-white',
        'shadow-xpRaised',
        // Quando selecionado: borda azul "dotted" clássica do foco XP
        selected && 'outline outline-2 outline-dotted outline-xp-sky outline-offset-[-3px]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-xp-text truncate">{title}</div>
          {subtitle && (
            <div className="text-[11px] text-xp-text/70 truncate">{subtitle}</div>
          )}
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>
    </button>
  );
}
