// Botão retrô: face em "papel" com sombra elevada. Quando pressionado,
// inverte a sombra (efeito clássico do Win9x/XP).
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'default' | 'primary';
}

/**
 * Button — botão estilo XP.
 * - variant="primary" dá um azul discreto (pra CTAs como "Agendar").
 * - Efeito pressed é feito em CSS puro (shadow swap), sem JS.
 */
export function Button({
  children,
  variant = 'default',
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        'px-4 py-1.5 text-[13px] font-sans',
        'shadow-xpRaised active:shadow-xpPressed',
        // Cor de fundo varia com o variant
        variant === 'primary' ? 'bg-xp-sky text-white' : 'bg-xp-paper text-xp-text',
        // Estado disabled: visual mais opaco
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
    >
      {children}
    </button>
  );
}
