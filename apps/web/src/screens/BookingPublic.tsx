// BookingPúblico — wizard de agendamento SEM precisar de login.
// Visitante preenche nome/email/telefone no passo final e o backend cria
// o appointment com campos guest_*.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Window } from '../components/ui/Window';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { OptionCard } from '../components/ui/OptionCard';
import { formatBRL, formatDuration } from '../lib/format';

const API = '/api';

interface Service { id: string; name: string; description: string | null; durationMin: number; priceCents: number; }
interface Barber  { id: string; initials: string; specialty: string | null; }
interface Slot    { time: string; taken: boolean; }

function generateDateSlots(date: Date): Slot[] {
  const slots: Slot[] = [];
  for (let h = 9; h < 19; h++) {
    for (const m of [0, 30]) {
      slots.push({
        time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        taken: false, // v0.4 puxa slots ocupados do backend
      });
    }
  }
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

type Step = 'service' | 'barber' | 'slot' | 'contact' | 'done';

export function BookingPublic() {
  const [step, setStep] = useState<Step>('service');
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers]   = useState<Barber[]>([]);
  const [service, setService]   = useState<Service | null>(null);
  const [barber, setBarber]     = useState<Barber | null>(null);
  const [date, setDate]         = useState(todayISO());
  const [time, setTime]         = useState<string | null>(null);

  // Contato do visitante
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/services`).then(r => r.json()),
      fetch(`${API}/users/barbers`).then(r => r.json()),
    ]).then(([s, b]) => {
      setServices(Array.isArray(s) ? s : []);
      setBarbers(Array.isArray(b) ? b : []);
    }).finally(() => setLoading(false));
  }, []);

  const slots = useMemo(() => {
    if (!date) return [];
    return generateDateSlots(new Date(`${date}T00:00`));
  }, [date]);

  async function confirm() {
    if (!service || !barber || !time) return;
    if (!name.trim() || !email.trim()) {
      setError('Nome e email são obrigatórios.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const startsAt = new Date(`${date}T${time}:00`).toISOString();
      const res = await fetch(`${API}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          barberId:  barber.id,
          startsAt,
          guest: { name: name.trim(), email: email.trim(), phone: phone.trim() || undefined },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? `Erro ${res.status}`);
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
    setName('');
    setEmail('');
    setPhone('');
    setDate(todayISO());
    setStep('service');
  }

  const title = `Agendar — ${
    step === 'service' ? '1/4 Serviço' :
    step === 'barber'  ? '2/4 Barbeiro' :
    step === 'slot'    ? '3/4 Horário'  :
    step === 'contact' ? '4/4 Seus dados' :
                         'Concluído'
  }`;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#008080] p-4">
      <Window title={title} width="min(640px, 92vw)">
        {/* Link discreto pra sair */}
        <div className="mb-2 -mt-1">
          <Link to="/" className="text-[11px] text-xp-sky underline">
            ← Voltar para a página inicial
          </Link>
        </div>

        {loading ? (
          <p className="text-[12px]">Carregando catálogo...</p>
        ) : (
          <>
            {/* PASSO 1: SERVIÇO */}
            {step === 'service' && (
              <div className="max-h-[420px] overflow-y-auto pr-2">
                {services.length === 0 ? (
                  <p className="text-[11px] text-xp-text/60 text-center py-6">
                    Nenhum serviço disponível.
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
                  <Button variant="primary" disabled={!time} onClick={() => setStep('contact')}>
                    Próximo →
                  </Button>
                </div>
              </div>
            )}

            {/* PASSO 4: CONTATO (visitante) */}
            {step === 'contact' && service && barber && time && (
              <div>
                <div className="bg-white p-2 mb-3 shadow-[inset_1px_1px_0_#7a7a7a,inset_-1px_-1px_0_#ffffff] text-[12px]">
                  <div className="mb-1"><b>Serviço:</b> {service.name}</div>
                  <div className="mb-1"><b>Barbeiro:</b> {barber.specialty ?? '—'}</div>
                  <div className="mb-1"><b>Data/Hora:</b> {date} às {time}</div>
                  <div><b>Total:</b> {formatBRL(service.priceCents / 100)}</div>
                </div>

                <p className="text-[11px] text-xp-text/70 mb-3">
                  Pra confirmar, deixa seu nome e email. O telefone é opcional
                  mas ajuda a te lembrar por WhatsApp.
                </p>

                <Field
                  label="Nome completo *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
                <Field
                  label="Email *"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Field
                  label="Telefone (WhatsApp)"
                  type="tel"
                  placeholder="(11) 98765-4321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />

                {error && (
                  <div className="text-[11px] text-xp-red mb-2 p-1 bg-white border border-xp-red">
                    ⚠ {error}
                  </div>
                )}

                <div className="flex justify-between items-center mt-3">
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
                <p className="text-[12px] text-xp-text/70 mb-2">
                  {service.name} com {barber.specialty ?? 'barbeiro'} em {date} às {time}.
                </p>
                <p className="text-[11px] text-xp-text/60 mb-4">
                  Entraremos em contato pelo {phone || email}.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={reset}>Novo agendamento</Button>
                  <Link to="/"><Button variant="primary">Voltar à página inicial</Button></Link>
                </div>
              </div>
            )}
          </>
        )}
      </Window>
    </div>
  );
}
