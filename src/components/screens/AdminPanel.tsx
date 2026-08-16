// Painel do dono — lista de agendamentos do dia, com opção de cancelar.
import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Window } from '../ui/Window';
import { Button } from '../ui/Button';
import { useBookingStore } from '../../store/booking';
import { SERVICES, BARBERS } from '../../data/services';
import { formatBRL } from '../../lib/format';

interface AdminPanelProps {
  onClose: () => void;
}

/**
 * AdminPanel — visão do dono da barbearia.
 * Lista agendamentos agrupados por data (ordenada), com botão "Cancelar".
 */
export function AdminPanel({ onClose }: AdminPanelProps) {
  const appointments = useBookingStore((s) => s.appointments);
  const removeAppointment = useBookingStore((s) => s.removeAppointment);

  // Agrupa por data e ordena (hoje primeiro, depois futuras)
  const grouped = useMemo(() => {
    const map = new Map<string, typeof appointments>();
    appointments.forEach((a) => {
      if (!map.has(a.date)) map.set(a.date, []);
      map.get(a.date)!.push(a);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, list]) => ({
        date,
        list: [...list].sort((x, y) => x.time.localeCompare(y.time)),
      }));
  }, [appointments]);

  function lookupService(id: string) { return SERVICES.find((s) => s.id === id); }
  function lookupBarber(id: string)  { return BARBERS.find((b) => b.id === id); }

  return (
    <Window title="Painel do Dono — Agenda" onClose={onClose}>
      <div className="max-h-[460px] overflow-y-auto pr-2">
        {grouped.length === 0 && (
          <div className="text-center text-[12px] text-xp-text/60 py-6">
            Nenhum agendamento por enquanto. Comece marcando um pelo fluxo do cliente!
          </div>
        )}

        {grouped.map(({ date, list }) => {
          const total = list.reduce((sum, a) => sum + (lookupService(a.serviceId)?.price ?? 0), 0);
          const dateLabel = format(parseISO(date), "EEEE, d 'de' MMMM", { locale: ptBR });

          return (
            <section key={date} className="mb-4">
              <header className="flex items-baseline justify-between mb-2">
                <h3 className="text-[13px] font-bold capitalize">{dateLabel}</h3>
                <span className="text-[11px] text-xp-text/70">
                  {list.length} {list.length === 1 ? 'agendamento' : 'agendamentos'} •{' '}
                  <b className="text-xp-green">{formatBRL(total)}</b>
                </span>
              </header>

              <table className="w-full text-[12px] bg-white shadow-xpRaised">
                <thead className="bg-xp-paperDark">
                  <tr>
                    <th className="text-left p-1.5">Hora</th>
                    <th className="text-left p-1.5">Cliente</th>
                    <th className="text-left p-1.5">Serviço</th>
                    <th className="text-left p-1.5">Barbeiro</th>
                    <th className="p-1.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((a) => {
                    const svc = lookupService(a.serviceId);
                    const brb = lookupBarber(a.barberId);
                    return (
                      <tr key={a.id} className="border-t border-xp-paperDark/60">
                        <td className="p-1.5 font-mono">{a.time}</td>
                        <td className="p-1.5">{a.customer}</td>
                        <td className="p-1.5">{svc?.name ?? '—'}</td>
                        <td className="p-1.5">{brb?.name ?? '—'}</td>
                        <td className="p-1.5 text-right">
                          <button
                            onClick={() => removeAppointment(a.id)}
                            className="text-xp-red hover:underline text-[11px]"
                          >
                            Cancelar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          );
        })}
      </div>

      <div className="flex justify-end mt-3">
        <Button onClick={onClose}>Fechar</Button>
      </div>
    </Window>
  );
}
