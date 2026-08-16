// Painel do Dono — vê tudo: agenda geral, staff, faturamento.
//
// OWNER é o único que vê:
// - Lista completa de staff (rota /api/users/staff é protegida por requireRole('OWNER'))
// - Faturamento agregado
// - Todos os agendamentos (RLS deixa passar tudo dentro do tenant)

import { useEffect, useState } from 'react';
import { format, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Window } from '../components/ui/Window';
import { Button } from '../components/ui/Button';
import { formatBRL } from '../lib/format';
import { useAuth } from '../auth/AuthProvider';

const API = '/api';

interface Appointment { id: string; startsAt: string; status: string; priceCents: number; serviceId: string; barberId: string; }
interface StaffMember { id: string; name: string; email: string; role: string; }

export function OwnerPanel() {
  const { signOut } = useAuth();
  const [appts, setAppts]   = useState<Appointment[]>([]);
  const [staff, setStaff]   = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/appointments`).then(r => r.json()),
      fetch(`${API}/users/staff`).then(r => r.json()),
    ]).then(([a, s]) => {
      setAppts(a);
      setStaff(s);
    }).finally(() => setLoading(false));
  }, []);

  // Métricas
  const today       = appts.filter(a => isToday(parseISO(a.startsAt)));
  const completed   = appts.filter(a => a.status === 'COMPLETED');
  const cancelled   = appts.filter(a => a.status === 'CANCELLED');
  const revenue     = completed.reduce((sum, a) => sum + a.priceCents, 0);
  const noShowRate  = appts.length > 0 ? Math.round((cancelled.length / appts.length) * 100) : 0;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#008080] p-6">
      <Window title="Painel do Dono — BunkerBarbershop">
        {loading ? (
          <p className="text-[12px]">Carregando...</p>
        ) : (
          <div className="grid grid-cols-[1fr_320px] gap-4 max-h-[480px] overflow-y-auto pr-1">
            {/* Coluna principal: agenda do dia */}
            <section>
              <h3 className="text-[13px] font-bold mb-2">
                Agenda de hoje — {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h3>
              {today.length === 0 ? (
                <p className="text-[11px] text-xp-text/60 py-4 text-center">
                  Sem agendamentos hoje.
                </p>
              ) : (
                <table className="w-full text-[12px] bg-white shadow-xpRaised">
                  <thead className="bg-xp-paperDark">
                    <tr>
                      <th className="text-left p-1.5">Hora</th>
                      <th className="text-left p-1.5">Cliente</th>
                      <th className="text-left p-1.5">Barbeiro</th>
                      <th className="text-left p-1.5">Serviço</th>
                      <th className="text-left p-1.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {today.map(a => (
                      <tr key={a.id} className="border-t border-xp-paperDark/60">
                        <td className="p-1.5 font-mono">{format(parseISO(a.startsAt), 'HH:mm')}</td>
                        <td className="p-1.5">—</td>
                        <td className="p-1.5">{a.barberId.slice(0, 4)}</td>
                        <td className="p-1.5">—</td>
                        <td className="p-1.5 text-[10px] uppercase">{a.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* Sidebar: métricas + staff */}
            <aside>
              {/* 4 KPI cards */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-white p-2 shadow-xpRaised">
                  <div className="text-[10px] text-xp-text/60 uppercase">Hoje</div>
                  <div className="text-[16px] font-bold text-xp-sky">{today.length}</div>
                </div>
                <div className="bg-white p-2 shadow-xpRaised">
                  <div className="text-[10px] text-xp-text/60 uppercase">Concluídos</div>
                  <div className="text-[16px] font-bold text-xp-green">{completed.length}</div>
                </div>
                <div className="bg-white p-2 shadow-xpRaised">
                  <div className="text-[10px] text-xp-text/60 uppercase">Receita</div>
                  <div className="text-[12px] font-bold text-xp-green">{formatBRL(revenue / 100)}</div>
                </div>
                <div className="bg-white p-2 shadow-xpRaised">
                  <div className="text-[10px] text-xp-text/60 uppercase">Cancel.</div>
                  <div className="text-[16px] font-bold text-xp-red">{noShowRate}%</div>
                </div>
              </div>

              {/* Lista de staff */}
              <h3 className="text-[13px] font-bold mb-2">Equipe ({staff.length})</h3>
              <div className="max-h-[200px] overflow-y-auto">
                {staff.map(s => (
                  <div key={s.id} className="bg-white p-2 mb-1 shadow-xpRaised text-[11px]">
                    <div className="font-bold">{s.name}</div>
                    <div className="text-xp-text/70">{s.email}</div>
                    <div className="text-[10px] uppercase text-xp-sky">{s.role}</div>
                  </div>
                ))}
              </div>

              <Button onClick={signOut} className="mt-3 w-full">
                Sair
              </Button>
            </aside>
          </div>
        )}
      </Window>
    </div>
  );
}
