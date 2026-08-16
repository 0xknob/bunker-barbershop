// Painel do Cliente — vê seus agendamentos + cria novo.
//
// Usa a API em /api/appointments (RLS garante que vê só os próprios).
// Refactor do BookingFlow anterior: agora busca serviços e barbeiros
// da API em vez do mock estático em data/services.ts.

import { useEffect, useState } from 'react';
import { Window } from '../components/ui/Window';
import { Button } from '../components/ui/Button';
import { OptionCard } from '../components/ui/OptionCard';
import { formatBRL, formatDuration } from '../lib/format';
import { useAuth } from '../auth/AuthProvider';

interface Service { id: string; name: string; description: string; durationMin: number; priceCents: number; }
interface Barber  { id: string; initials: string; specialty: string; }
interface Appointment { id: string; startsAt: string; status: string; serviceId: string; barberId: string; }

const API = '/api';

export function ClientPanel() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers]   = useState<Barber[]>([]);
  const [mine, setMine]         = useState<Appointment[]>([]);
  const [loading, setLoading]   = useState(true);

  // Carrega tudo do backend
  useEffect(() => {
    Promise.all([
      fetch(`${API}/services`).then(r => r.json()),
      fetch(`${API}/users/barbers`).then(r => r.json()),
      fetch(`${API}/appointments`).then(r => r.json()),
    ]).then(([svc, brb, appt]) => {
      setServices(svc);
      setBarbers(brb);
      setMine(appt);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#008080] p-6">
      <Window title={`Olá, ${user?.name} — Seus agendamentos`}>
        {loading ? (
          <p className="text-[12px]">Carregando...</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1">
            {/* Coluna 1: catálogo + agendamento rápido */}
            <section>
              <h3 className="text-[13px] font-bold mb-2">Catálogo ({services.length})</h3>
              {services.map(s => (
                <OptionCard
                  key={s.id}
                  selected={false}
                  onClick={() => {/* abre wizard de booking — commit 13.1 */}}
                  title={s.name}
                  subtitle={`${formatDuration(s.durationMin)} • ${s.description}`}
                  badge={<span className="text-[12px] font-bold text-xp-green">{formatBRL(s.priceCents / 100)}</span>}
                />
              ))}
            </section>

            {/* Coluna 2: meus agendamentos */}
            <section>
              <h3 className="text-[13px] font-bold mb-2">Meus agendamentos ({mine.length})</h3>
              {mine.length === 0 ? (
                <p className="text-[11px] text-xp-text/60">Nenhum agendamento ainda.</p>
              ) : (
                mine.map(a => {
                  const svc = services.find(s => s.id === a.serviceId);
                  return (
                    <div key={a.id} className="bg-white p-2 mb-2 shadow-xpRaised text-[12px]">
                      <div className="font-bold">{svc?.name ?? '—'}</div>
                      <div className="text-xp-text/70">
                        {new Date(a.startsAt).toLocaleString('pt-BR')}
                      </div>
                      <div className="text-[10px] uppercase">{a.status}</div>
                    </div>
                  );
                })
              )}
              <Button variant="primary" className="mt-2 w-full">
                Agendar novo
              </Button>
            </section>
          </div>
        )}
      </Window>
    </div>
  );
}
