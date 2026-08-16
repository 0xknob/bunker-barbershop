// BIOSBootScreen — primeira tela que o usuário vê.
// Imita o "POST" de uma BIOS antiga: lista de checagens que aparecem
// linha a linha, com cursor piscando, depois fade e transição pro Desktop.
import { useEffect, useState } from 'react';

// Linhas do POST — strings estáticas pra não vazar nada de runtime no bundle.
// Cada tupla: [texto, delayMs-após-a-anterior].
const POST_SEQUENCE: Array<[string, number]> = [
  ['BUNKER-BARBERSHOP BIOS v1.0.0  (c) 2026, Senac Tech Edition', 0],
  ['Copyright (C) 1981-2026 The Barbeiro Project Authors.', 250],
  ['', 120],
  ['Award Modular BIOS v4.51PG, An Energy Star Ally', 220],
  ['Main Processor   : React 19.2.8              [  4500MHz]', 320],
  ['Memory Testing  : 524288K OK', 280],
  ['Primary Master  : Vite 8.2.0                 [  120GB ]', 240],
  ['Detecting Barber Shop Services...   OK', 300],
  ['Detecting Time Slots..............   OK', 220],
  ['Loading Admin Panel...............   OK', 260],
  ['Loading Scheduling Engine.........   OK', 240],
  ['', 120],
  ['Press <DEL> to enter Setup, <F8> to enter Booking Mode', 220],
];

interface BIOSBootScreenProps {
  onComplete: () => void;
}

/**
 * Renderiza a sequência acima com efeito typewriter.
 * Ao terminar todas as linhas, aguarda 800ms e chama onComplete().
 */
export function BIOSBootScreen({ onComplete }: BIOSBootScreenProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let cumulative = 0;

    POST_SEQUENCE.forEach(([text, delay], idx) => {
      cumulative += delay;
      window.setTimeout(() => {
        if (cancelled) return;
        setLines((prev) => {
          const next = [...prev];
          next[idx] = text;
          return next;
        });
      }, cumulative);
    });

    // Tempo total + folga antes do fade-out
    const totalMs = cumulative + 800;
    window.setTimeout(() => {
      if (cancelled) return;
      setDone(true);
      window.setTimeout(onComplete, 600); // duração do fade (ver index.css)
    }, totalMs);

    return () => {
      cancelled = true;
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 bg-black text-bios-fg font-mono text-[14px] leading-snug p-8 ${done ? 'fade-out' : ''}`}
      aria-label="Tela de boot estilo BIOS"
    >
      {/* Header com nome do fabricante — vibe placa-mãe */}
      <div className="mb-4">
        <div className="text-bios-bright text-[16px]">BUNKER-BARBERSHOP BIOS</div>
        <div className="text-bios-fg/70 text-[12px]">Setup Utility, Release 1.0.0</div>
      </div>

      {/* Linhas do POST — já preenchidas até onde o efeito chegou */}
      <div className="whitespace-pre-wrap">
        {POST_SEQUENCE.map((_text, idx) => (
          <div key={idx} className="min-h-[1.2em]">
            {lines[idx] ?? ''}
          </div>
        ))}
      </div>

      {/* Cursor piscando na última linha "viva" */}
      <span className="inline-block w-[10px] h-[16px] bg-bios-fg align-middle cursor-blink" />
    </div>
  );
}
