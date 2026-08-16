// Campo de input estilo XP: rótulo, caixa com borda dupla (sombra elevada
// interna) e foco discreto em azul.
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
}

/**
 * Field — input com label.
 * A borda em "sunken" é simulada com inset shadow para evitar CSS externo.
 */
export function Field({ label, icon, className, ...rest }: FieldProps) {
  return (
    <label className="block mb-3">
      <span className="block mb-1 text-[12px] font-bold text-xp-text">{label}</span>
      <div
        className={cn(
          'flex items-center gap-2 bg-white px-2 py-1',
          // Inset claro no topo/esquerda + inset escuro embaixo/direita = "sunken"
          'shadow-[inset_1px_1px_0_#7a7a7a,inset_-1px_-1px_0_#ffffff]',
        )}
      >
        {icon && <span className="text-xp-text/70">{icon}</span>}
        <input
          {...rest}
          className={cn(
            'w-full bg-transparent outline-none text-[13px] text-xp-text',
            // Foco vira borda azul fina (sem mudar layout)
            'focus:ring-1 focus:ring-xp-sky/60 rounded-sm px-1',
            className,
          )}
        />
      </div>
    </label>
  );
}
