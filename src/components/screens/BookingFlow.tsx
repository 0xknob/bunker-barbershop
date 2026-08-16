// Fluxo de agendamento do cliente.
// 3 passos (serviço → barbeiro → horário) + confirmação final.
// Tudo num único componente pra ficar fácil de ler — quando virar API,
// cada passo pode virar rota.
import { useMemo, useState } from 'react';
import { Window } from '../ui/Window';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { OptionCard } from '../ui/OptionCard';
import { formatBRL, formatDuration } from '../../lib/format';
import { SERVICES, BARBERS, generateSlots } from '../../data/services';
import { useBookingStore } from '../../store/booking';
import type { Service, Barber } from '../../data/services';

interface BookingFlowProps {
  onClose: () => void;
}

// ISO yyyy-MM-dd da data local (evita bug de timezone).
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Step = 'service' | 'barber' | 'slot' | 'confirm' | 'done';

/**
 * BookingFlow — wizard de 4 passos.
 * Mantém o estado interno simples: cada "step" tem seu sub-estado.
 */
export function BookingFlow({ onClose }: BookingFlowProps) {
  const [step, setStep] = useState<Step>('service');
  const [service, setService] = useState<Service | null>(null);
  const [barber, setBarber] = useState<Barber | null>(null);
  const [date, setDate] = useState<string>(todayISO());
  const [time, setTime] = useState<string | null>(null);
  const [customer, setCustomer] = useState('');

  const addAppointment = useBookingStore((s) => s.addAppointment);
  const getBookedSlots = useBookingStore((s) => s.getBookedSlots);

  // Slots disponíveis = todos gerados - já reservados
  const slots = useMemo(() => {
    if (!barber) return [];
    const baseSlots = generateSlots(new Date(date));
    const booked = barber ? getBookedSlots(date, barber.id) : [];
    return baseSlots.map((s) => ({ time: s, taken: booked.includes(s) }));
  }, [date, barber, getBookedSlots]);

  function handleConfirm() {
    if (!service || !barber || !time) return;
    addAppointment({
      serviceId: service.id,
      barberId: barber.id,
      date,
      time,
      customer: customer.trim() || 'Cliente',
    });
    setStep('done');
  }

  function reset() {
    setService(null);
    setBarber(null);
    setTime(null);
    setCustomer('');
    setDate(todayISO());
    setStep('service');
  }

  // Título da janela muda conforme o passo — feedback de progresso
  const title = `Agendamento — ${
    step === 'service' ? '1/4 Escolha o serviço' :
    step === 'barber'  ? '2/4 Escolha o barbeiro' :
    step === 'slot'    ? '3/4 Escolha o horário'  :
    step === 'confirm' ? '4/4 Confirme seus dados' :
                         'Concluído'
  }`;

  return (
    <Window title={title} onClose={onClose}>
      {/* ─── PASSO 1: SERVIÇO ─────────────────────────────────────── */}
      {step === 'service' && (
        <div className="max-h-[420px] overflow-y-auto pr-2">
          {SERVICES.map((s) => (
            <OptionCard
              key={s.id}
              selected={service?.id === s.id}
              onClick={() => setService(s)}
              title={s.name}
              subtitle={`${formatDuration(s.durationMin)} • ${s.description}`}
              badge={<span className="text-[12px] font-bold text-xp-green">{formatBRL(s.price)}</span>}
            />
          ))}
          <div className="flex justify-end mt-3">
            <Button variant="primary" disabled={!service} onClick={() => setStep('barber')}>
              Próximo →
            </Button>
          </div>
        </div>
      )}

      {/* ─── PASSO 2: BARBEIRO ───────────────────────────────────── */}
      {step === 'barber' && (
        <div className="max-h-[420px] overflow-y-auto pr-2">
          {BARBERS.map((b) => (
            <OptionCard
              key={b.id}
              selected={barber?.id === b.id}
              onClick={() => setBarber(b)}
              title={b.name}
              subtitle={b.specialty}
              badge={
                <div className="w-10 h-10 bg-xp-sky text-white flex items-center justify-center font-bold text-[13px]">
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
        </div>
      )}

      {/* ─── PASSO 3: DATA + HORA ────────────────────────────────── */}
      {step === 'slot' && (
        <div>
          <Field
            label="Data"
            type="date"
            value={date}
            min={todayISO()}
            onChange={() => setTime(null)}
            onInput={(e) => setDate((e.target as HTMLInputElement).value)}
          />

          <div className="text-[12px] font-bold mb-1 mt-2">Horários disponíveis</div>

          <div className="grid grid-cols-4 gap-2 max-h-[280px] overflow-y-auto pr-1">
            {slots.map(({ time: t, taken }) => (
              <button
                key={t}
                disabled={taken}
                onClick={() => setTime(t)}
                className={[
                  'py-2 text-[12px] font-mono shadow-xpRaised',
                  taken
                    ? 'bg-xp-paperDark text-xp-text/40 line-through cursor-not-allowed'
                    : time === t
                      ? 'bg-xp-sky text-white shadow-xpPressed'
                      : 'bg-white text-xp-text',
                ].join(' ')}
              >
                {t}
              </button>
            ))}
            {slots.length === 0 && (
              <div className="col-span-4 text-center text-[12px] text-xp-text/60 py-6">
                Sem horários disponíveis nesta data.
              </div>
            )}
          </div>

          <div className="flex justify-between mt-4">
            <Button onClick={() => setStep('barber')}>← Voltar</Button>
            <Button variant="primary" disabled={!time} onClick={() => setStep('confirm')}>
              Próximo →
            </Button>
          </div>
        </div>
      )}

      {/* ─── PASSO 4: CONFIRMAÇÃO ────────────────────────────────── */}
      {step === 'confirm' && service && barber && time && (
        <div>
          <div className="bg-white p-3 mb-3 shadow-[inset_1px_1px_0_#7a7a7a,inset_-1px_-1px_0_#ffffff]">
            <div className="text-[12px] mb-1"><b>Serviço:</b> {service.name}</div>
            <div className="text-[12px] mb-1"><b>Barbeiro:</b> {barber.name}</div>
            <div className="text-[12px] mb-1"><b>Data/Hora:</b> {date} às {time}</div>
            <div className="text-[12px]"><b>Total:</b> {formatBRL(service.price)}</div>
          </div>

          <Field
            label="Seu nome"
            placeholder="Como podemos te chamar?"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            maxLength={60}
          />

          <div className="flex justify-between mt-2">
            <Button onClick={() => setStep('slot')}>← Voltar</Button>
            <Button variant="primary" onClick={handleConfirm}>
              Confirmar agendamento
            </Button>
          </div>
        </div>
      )}

      {/* ─── TELA FINAL ──────────────────────────────────────────── */}
      {step === 'done' && (
        <div className="text-center py-4">
          <div className="text-[40px] mb-2">✅</div>
          <h3 className="text-[14px] font-bold mb-1">Agendamento confirmado!</h3>
          <p className="text-[12px] text-xp-text/70 mb-4">
            {service?.name} com {barber?.name} em {date} às {time}.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={reset}>Novo agendamento</Button>
            <Button variant="primary" onClick={onClose}>Fechar</Button>
          </div>
        </div>
      )}
    </Window>
  );
}
