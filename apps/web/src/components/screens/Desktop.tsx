// Desktop — "área de trabalho" que aparece após o boot.
// Fundo verde-azulado XP + ícones grandes + barra de tarefas embaixo.
import { useEffect, useState } from 'react';
import { Welcome } from './Welcome';
import { BookingFlow } from './BookingFlow';
import { AdminPanel } from './AdminPanel';
import { TaskbarButton } from '../ui/TaskbarButton';

type App = 'welcome' | 'booking' | 'admin';

/**
 * Desktop — gerencia qual janela está ativa e renderiza a barra de tarefas.
 * Estado local simples (sem Zustand) porque só ele consome.
 */
export function Desktop() {
  const [open, setOpen] = useState<App>('welcome');

  return (
    <div className="fixed inset-0 flex flex-col bg-[#008080]">
      {/* Área central onde as janelas ficam (estilo flutuante, sem drag) */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        {open === 'welcome' && (
          <Welcome onBook={() => setOpen('booking')} onAdmin={() => setOpen('admin')} />
        )}
        {open === 'booking' && <BookingFlow onClose={() => setOpen('welcome')} />}
        {open === 'admin'  && <AdminPanel  onClose={() => setOpen('welcome')} />}
      </div>

      {/* Taskbar — barra inferior fixa, gradiente azul XP */}
      <footer className="bg-gradient-to-b from-xp-taskbarLight to-xp-taskbar border-t border-xp-skyDark px-2 py-1 flex gap-1">
        <TaskbarButton
          icon="✂"
          label="Agendar"
          active={open === 'booking'}
          onClick={() => setOpen('booking')}
        />
        <TaskbarButton
          icon="📅"
          label="Painel do Dono"
          active={open === 'admin'}
          onClick={() => setOpen('admin')}
        />
        <div className="ml-auto flex items-center px-3 text-white text-[12px] font-bold">
          {/* Relógio fake — só pra estética; usa o sistema real */}
          <Clock />
        </div>
      </footer>
    </div>
  );
}

// Relógio na barra — atualiza a cada 30s, sem re-render do app todo.
function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return <span>{now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>;
}
