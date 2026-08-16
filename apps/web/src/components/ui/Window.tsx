// Container "janela" no estilo XP:
// - moldura externa cinza com sombra elevada
// - título azul no topo
// - área interna cor de papel (off-white)
import type { ReactNode } from 'react';
import { TitleBar } from './TitleBar';
import { cn } from '../../lib/cn';

interface WindowProps {
  title: string;
  icon?: ReactNode;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
  // Largura/altura mínimas pra janelas responsivas
  width?: string;
}

/**
 * Window — moldura retrô XP. Envolve conteúdo com chrome + título azul.
 * Use dentro do Desktop; ela mesma não é arrastável (você pediu UI limpa
 * sem libs de drag — manteremos fixa no fluxo atual).
 */
export function Window({
  title,
  icon,
  onClose,
  children,
  className,
  width = 'min(640px, 92vw)',
}: WindowProps) {
  return (
    <div
      style={{ width }}
      className={cn(
        // Sombra dupla: borda XP elevada + sombra preta pra "flutuar"
        'shadow-xpRaised',
        'border border-xp-chromeShadow/50',
        className,
      )}
    >
      <TitleBar title={title} icon={icon} onClose={onClose} />

      {/* Área interna em "papel" — é onde vai o conteúdo de verdade */}
      <div className="bg-xp-paper text-xp-text p-4">{children}</div>
    </div>
  );
}
