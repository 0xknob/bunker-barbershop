// Painel do Barbeiro — agenda do dia + métricas próprias.
//
// BARBER vê: agendamentos onde ele é o barbeiro (RLS + filtro no back).
// Pode: confirmar (status PENDING → CONFIRMED), marcar como COMPLETED,
// ou cancelar (com motivo).

import { useEffect, useState } from 'react';
import { format, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Window } from '../components/ui/Window';
import { Button } from '../components/ui/Button';
import { formatBRL } from '../lib/format';
import { useAuth } from '../auth/AuthProvider';

const API = '/api';

interface Appointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  priceCents: number;
  customerName: string;
  serviceName: string;
}

export function BarberPanel() {
  const { user } = useAuth();
  const [items, setItems]   = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch(`${API}/appointments`);
    const data = await res.json();
    setItems(data);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function markStatus(id: string, status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') {
    await fetch(`${API}/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  // Filtra só os de hoje (BARBER vê só onde ele é o barbeiro — back já filtra)
  const today = items.filter(a => isToday(parseISO(a.startsAt)));
  const completed = items.filter(a => a.status === 'COMPLETED');
  const myRevenue = completed.reduce((sum, a) => sum + a.priceCents, 0);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#008080] p-6">
      <Window title={`Agenda — ${user?.name}`}>
        {loading ? (
          <p className="text-[12px]">Carregando agenda...</p>
        ) : (
          <>
            {/* Métricas no topo */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-white p-2 shadow-xpRaised">
                <div className="text-[10px] text-xp-text/60 uppercase">Hoje</div>
                <div className="text-[18px] font-bold text-xp-sky">{today.length}</div>
              </div>
              <div className="bg-white p-2 shadow-xpRaised">
                <div className="text-[10px] text-xp-text/60 uppercase">Concluídos</div>
                <div className="text-[18px] font-bold text-xp-green">{completed.length}</div>
              </div>
              <div className="bg-white p-2 shadow-xpRaised">
                <div className="text-[10px] text-xp-text/60 uppercase">Faturamento</div>
                <div className="text-[14px] font-bold text-xp-green">{formatBRL(myRevenue / 100)}</div>
              </div>
            </div>

            {/* Lista de hoje */}
            <h3 className="text-[13px] font-bold mb-2">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h3>
            {today.length === 0 ? (
              <p className="text-[11px] text-xp-text/60 py-4 text-center">
                Nada agendado pra hoje.
              </p>
            ) : (
              <table className="w-full text-[12px] bg-white shadow-xpRaised">
                <thead className="bg-xp-paperDark">
                  <tr>
                    <th className="text-left p-1.5">Hora</th>
                    <th className="text-left p-1.5">Cliente</th>
                    <th className="text-left p-1.5">Serviço</th>
                    <th className="text-left p-1.5">Status</th>
                    <th className="p-1.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {today.map(a => (
                    <tr key={a.id} className="border-t border-xp-paperDark/60">
                      <td className="p-1.5 font-mono">
                        {format(parseISO(a.startsAt), 'HH:mm')}
                      </td>
                      <td className="p-1.5">{a.customerName ?? '—'}</td>
                      <td className="p-1.5">{a.serviceName}</td>
                      <td className="p-1.5">
                        <span className={[
                          'text-[10px] uppercase px-1',
                          a.status === 'CONFIRMED' && 'bg-xp-sky text-white',
                          a.status === 'COMPLETED' && 'bg-xp-green text-white',
                          a.status === 'CANCELLED' && 'bg-xp-red text-white',
                        ].filter(Boolean).join(' ')}>
                          {a.status}
                        </span>
                      </td>
                      <td className="p-1.5 text-right space-x-1">
                        {a.status === 'PENDING' && (
                          <button onClick={() => markStatus(a.id, 'CONFIRMED')}
                                  className="text-[10px] text-xp-sky underline">
                            Confirmar
                          </button>
                        )}
                        {a.status === 'CONFIRMED' && (
                          <button onClick={() => markStatus(a.id, 'COMPLETED')}
                                  className="text-[10px] text-xp-green underline">
                            Concluir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </Window>
    </div>
  );
}
