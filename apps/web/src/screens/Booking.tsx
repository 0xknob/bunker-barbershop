// Booking — wizard completo de agendamento (rota /booking).
// Acessível por qualquer um logado (CUSTOMER, BARBER, OWNER).
// 4 passos: serviço → barbeiro → data+slot → confirmação.

import { useEffect, useMemo, useState } from 'react';
import { Window } from '../components/ui/Window';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { OptionCard } from '../components/ui/OptionCard';
import { formatBRL, formatDuration } from '../lib/format';
import { useAuth } from '../auth/AuthProvider';

const API = '/api';

interface Service { id: string; name: string; description: string | null; durationMin: number; priceCents: number; }
interface Barber  { id: string; initials: string; specialty: string | null; }
interface Slot    { time: string; taken: boolean; }

function generateDateSlots(date: Date, taken: string[]): Slot[] {
  const slots: Slot[] = [];
  for (let h = 9; h < 19; h++) {
    for (const m of [0, 30]) {
      slots.push({
        time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        taken: taken.includes(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`),
      });
    }
  }
  // Slots passados do dia ficam indisponíveis
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    const hh = now.getHours();
    const mm = now.getMinutes() < 30 ? 0 : 30;
    return slots.filter(s => {
      const [sh, sm] = s.time.split(':').map(Number);
      return sh > hh || (sh === hh && sm >= mm);
    });
  }
  return slots;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Step = 'service' | 'barber' | 'slot' | 'confirm' | 'done';

export function Booking() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('service');
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers]   = useState<Barber[]>([]);
  const [service, setService]   = useState<Service | null>(null);
  const [barber, setBarber]     = useState<Barber | null>(null);
  const [date, setDate]         = useState(todayISO());
  const [time, setTime]         = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Carrega catálogo
  useEffect(() => {
    Promise.all([
      fetch(`${API}/services`).then(r => r.json()),
      fetch(`${API}/users/barbers`).then(r => r.json()),
    ]).then(([s, b]) => {
      setServices(Array.isArray(s) ? s : []);
      setBarbers(Array.isArray(b) ? b : []);
    }).finally(() => setLoading(false));
  }, []);

  // Slots disponíveis (sem chamada de API, gerado client-side)
  const slots = useMemo(() => {
    if (!date) return [];
    const fakeTaken: string[] = []; // Em v0.4, isto vem de /api/appointments?date=X
    return generateDateSlots(new Date(`${date}T00:00`), fakeTaken);
  }, [date]);

  async function confirm() {
    if (!service || !barber || !time) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          barberId:  barber.id,
          startsAt:  new Date(`${date}T${time}:00`).toISOString(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.message ?? `Erro ${res.status}`);
        return;
      }
      setStep('done');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setService(null);
    setBarber(null);
    setTime(null);
    setDate(todayISO());
    setStep('service');
  }

  const title = `Agendar atendimento — ${
    step === 'service' ? '1/4 Serviço' :
    step === 'barber'  ? '2/4 Barbeiro' :
    step === 'slot'    ? '3/4 Horário'  :
    step === 'confirm' ? '4/4 Confirmar' :
                         'Concluído'
  }`;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#008080] p-4">
      <Window title={title} width="min(640px, 92vw)">
        {loading ? (
          <p className="text-[12px]">Carregando catálogo...</p>
        ) : (
          <>
            {/* PASSO 1: SERVIÇO */}
            {step === 'service' && (
              <div className="max-h-[420px] overflow-y-auto pr-2">
                {services.length === 0 ? (
                  <p className="text-[11px] text-xp-text/60 text-center py-6">
                    Nenhum serviço cadastrado.
                  </p>
                ) : services.map(s => (
                  <OptionCard
                    key={s.id}
                    selected={service?.id === s.id}
                    onClick={() => setService(s)}
                    title={s.name}
                    subtitle={`${formatDuration(s.durationMin)} • ${s.description ?? ''}`}
                    badge={<span className="text-[12px] font-bold text-xp-green">{formatBRL(s.priceCents / 100)}</span>}
                  />
                ))}
                <div className="flex justify-end mt-3">
                  <Button variant="primary" disabled={!service} onClick={() => setStep('barber')}>
                    Próximo →
                  </Button>
                </div>
              </div>
            )}

            {/* PASSO 2: BARBEIRO */}
            {step === 'barber' && (
              <>
                {barbers.length === 0 ? (
                  <p className="text-[11px] text-xp-text/60 text-center py-6">
                    Nenhum barbeiro disponível.
                  </p>
                ) : barbers.map(b => (
                  <OptionCard
                    key={b.id}
                    selected={barber?.id === b.id}
                    onClick={() => setBarber(b)}
                    title={b.specialty ?? 'Barbeiro'}
                    subtitle={b.initials}
                    badge={
                      <div className="w-10 h-10 bg-xp-sky text-white flex items-center justify-center font-bold text-[14px]">
                        {b.initials}
                      </div>
                    }
                  />
                ))}
                <div className="flex justify-between mt-3">
                  <Button onClick={() => setStep('service')}>← Voltar</Button>
                  <Button variant="primary" disabled={!barber} onClick={() => setStep('slot')}>
                    Próximo →
                  </Button>
                </div>
              </>
            )}

            {/* PASSO 3: DATA + SLOT */}
            {step === 'slot' && (
              <div>
                <Field
                  label="Data"
                  type="date"
                  value={date}
                  min={todayISO()}
                  onChange={(e) => { setTime(null); setDate(e.target.value); }}
                />
                <div className="text-[12px] font-bold mt-2 mb-1">Horários disponíveis</div>
                <div className="grid grid-cols-4 gap-2 max-h-[280px] overflow-y-auto pr-1">
                  {slots.length === 0 ? (
                    <div className="col-span-4 text-center text-[12px] text-xp-text/60 py-6">
                      Sem horários.
                    </div>
                  ) : slots.map(s => (
                    <button
                      key={s.time}
                      disabled={s.taken}
                      onClick={() => setTime(s.time)}
                      className={[
                        'py-2 text-[12px] font-mono shadow-xpRaised',
                        s.taken
                          ? 'bg-xp-paperDark text-xp-text/40 line-through cursor-not-allowed'
                          : time === s.time
                            ? 'bg-xp-sky text-white shadow-xpPressed'
                            : 'bg-white text-xp-text',
                      ].join(' ')}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between mt-4">
                  <Button onClick={() => setStep('barber')}>← Voltar</Button>
                  <Button variant="primary" disabled={!time} onClick={() => setStep('confirm')}>
                    Próximo →
                  </Button>
                </div>
              </div>
            )}

            {/* PASSO 4: CONFIRMAR */}
            {step === 'confirm' && service && barber && time && (
              <div>
                <div className="bg-white p-3 mb-3 shadow-[inset_1px_1px_0_#7a7a7a,inset_-1px_-1px_0_#ffffff] text-[12px]">
                  <div className="mb-1"><b>Cliente:</b> {user?.name} ({user?.email})</div>
                  <div className="mb-1"><b>Serviço:</b> {service.name}</div>
                  <div className="mb-1"><b>Barbeiro:</b> {barber.specialty ?? '—'}</div>
                  <div className="mb-1"><b>Data/Hora:</b> {date} às {time}</div>
                  <div><b>Total:</b> {formatBRL(service.priceCents / 100)}</div>
                </div>
                <div className="flex justify-between">
                  <Button onClick={() => setStep('slot')}>← Voltar</Button>
                  <Button variant="primary" onClick={confirm} disabled={submitting}>
                    {submitting ? 'Confirmando...' : 'Confirmar agendamento'}
                  </Button>
                </div>
              </div>
            )}

            {/* CONCLUÍDO */}
            {step === 'done' && service && barber && time && (
              <div className="text-center py-4">
                <div className="text-[40px] mb-2">✅</div>
                <h3 className="text-[14px] font-bold mb-1">Agendamento confirmado!</h3>
                <p className="text-[12px] text-xp-text/70 mb-4">
                  {service.name} com {barber.specialty ?? 'barbeiro'} em {date} às {time}.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={reset}>Novo agendamento</Button>
                  <Button variant="primary" onClick={() => window.history.back()}>Voltar</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Window>
    </div>
  );
}
