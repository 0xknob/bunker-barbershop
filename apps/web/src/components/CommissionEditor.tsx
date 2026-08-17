// CommissionEditor — modal estilo XP pra editar a comissão de um barbeiro.
// Só OWNER vê esse componente (usado dentro do OwnerPanel).
//
// commission_pct é armazenado em basis points: 10000 = 100%.
// Pra UX melhor, mostramos em % (50.00%) e convertemos antes de enviar.

import { useEffect, useState } from 'react';
import { Window } from './ui/Window';
import { Button } from './ui/Button';
import { Field } from './ui/Field';

interface Barber {
  id: string;
  initials: string;
  specialty: string;
  commissionPct: number; // basis points
}

interface Props {
  barber: Barber | null;
  onClose: () => void;
  onSaved: (updated: Barber) => void;
}

const API = '/api';

export function CommissionEditor({ barber, onClose, onSaved }: Props) {
  const [pct, setPct]     = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincroniza estado quando abre o modal pra outro barbeiro
  useEffect(() => {
    if (barber) {
      setPct((barber.commissionPct / 100).toFixed(2));
      setError(null);
    }
  }, [barber]);

  if (!barber) return null;

  async function save() {
    setSaving(true);
    setError(null);
    const numericPct = parseFloat(pct);
    if (isNaN(numericPct) || numericPct < 0 || numericPct > 100) {
      setError('Comissão deve estar entre 0 e 100.');
      setSaving(false);
      return;
    }

    const res = await fetch(`${API}/barbers/${barber!.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        commissionPct: Math.round(numericPct * 100), // converte % → basis points
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.message ?? `Erro ${res.status}`);
      setSaving(false);
      return;
    }

    const updated = await res.json();
    onSaved({ ...barber!, commissionPct: updated.commissionPct });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
      <Window title={`Editar comissão — ${barber.initials}`} onClose={onClose} width="min(360px, 92vw)">
        <div className="space-y-3">
          <div className="bg-white p-2 shadow-xpRaised text-[12px]">
            <div><b>Barbeiro:</b> {barber.specialty}</div>
            <div><b>Atual:</b> {(barber.commissionPct / 100).toFixed(2)}%</div>
            <div><b>Decimais:</b> até 2 casas (ex: 42.50 = 42,50%)</div>
          </div>

          <Field
            label="Comissão (%)"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            placeholder="50.00"
            autoFocus
          />

          {error && (
            <div className="text-[11px] text-xp-red p-1 bg-white border border-xp-red">
              ⚠ {error}
            </div>
          )}

          <div className="flex justify-between mt-3">
            <Button onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button variant="primary" onClick={save} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </Window>
    </div>
  );
}
