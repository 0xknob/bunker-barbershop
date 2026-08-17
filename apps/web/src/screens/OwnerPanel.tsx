// Painel do Dono — TabStrip estilo XP com 2 abas:
// 1. Agenda (KPIs + tabela do dia + lista staff resumida)
// 2. Controles (tabela CRUD de produtos + edição de comissão inline)

import { useEffect, useState } from 'react';
import { format, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Window } from '../components/ui/Window';
import { Button } from '../components/ui/Button';
import { formatBRL } from '../lib/format';
import { useAuth } from '../auth/AuthProvider';
import { CommissionEditor } from '../components/CommissionEditor';

const API = '/api';

interface Appointment { id: string; startsAt: string; status: string; priceCents: number; serviceId: string; barberId: string; }
interface StaffMember { id: string; name: string; email: string; role: string; commissionPct: number | null; }
interface Product {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  retailPriceCents: number;
  currentStock: number;
  lowStockThreshold: number;
  isActive: boolean;
}

type Tab = 'agenda' | 'controles';
type SubTab = 'produtos' | 'equipe';

export function OwnerPanel() {
  const { signOut, user } = useAuth();
  const [tab, setTab]           = useState<Tab>('agenda');
  const [subTab, setSubTab]     = useState<SubTab>('produtos');
  const [appts, setAppts]       = useState<Appointment[]>([]);
  const [staff, setStaff]       = useState<StaffMember[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState<StaffMember | null>(null);

  async function load() {
    const [a, s, p] = await Promise.all([
      fetch(`${API}/appointments`).then(r => r.json()),
      fetch(`${API}/users/staff`).then(r => r.json()),
      fetch(`${API}/products?all=true`).then(r => r.json()),
    ]);
    setAppts(Array.isArray(a) ? a : []);
    setStaff(Array.isArray(s) ? s : []);
    setProducts(Array.isArray(p) ? p : []);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  // Métricas agenda
  const today       = appts.filter(a => isToday(parseISO(a.startsAt)));
  const completed   = appts.filter(a => a.status === 'COMPLETED');
  const cancelled   = appts.filter(a => a.status === 'CANCELLED');
  const revenue     = completed.reduce((sum, a) => sum + a.priceCents, 0);
  const noShowRate  = appts.length > 0 ? Math.round((cancelled.length / appts.length) * 100) : 0;

  // Métricas produtos
  const totalSkus    = products.length;
  const lowStockCount = products.filter(p => p.currentStock <= p.lowStockThreshold).length;
  const outOfStock   = products.filter(p => p.currentStock === 0).length;
  const stockValue   = products.reduce((sum, p) => sum + (p.retailPriceCents * p.currentStock), 0);

  function handleSaved(updated: StaffMember) {
    setStaff(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
  }

  async function handleStockChange(productId: string, newStock: number) {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, currentStock: newStock } : p));
    await fetch(`${API}/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentStock: newStock }),
    });
  }

  async function handleToggleActive(productId: string, currentActive: boolean) {
    const newActive = !currentActive;
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, isActive: newActive } : p));
    await fetch(`${API}/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: newActive }),
    });
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#008080] p-4">
      <Window title="Painel do Dono — BunkerBarbershop" width="min(1200px, 96vw)">
        {loading ? (
          <p className="text-[12px]">Carregando...</p>
        ) : (
          <>
            {/* TabStrip XP */}
            <div className="flex gap-0 mb-3 border-b border-xp-chromeShadow">
              {(['agenda', 'controles'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={[
                    'px-4 py-1.5 text-[12px]',
                    tab === t
                      ? 'bg-xp-paper shadow-xpRaised border-b-2 border-xp-sky font-bold'
                      : 'bg-xp-paperDark hover:bg-xp-paper/50',
                  ].join(' ')}
                >
                  {t === 'agenda' ? '📅 Agenda' : '⚙️ Controles do Dono'}
                </button>
              ))}
            </div>

            {/* ─── ABA AGENDA ───────────────────────────────────── */}
            {tab === 'agenda' && (
              <div className="grid grid-cols-[1fr_320px] gap-4">
                <section>
                  <h3 className="text-[13px] font-bold mb-2">
                    Agenda de hoje — {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                    <span className="text-[11px] text-xp-text/60 ml-2">({today.length})</span>
                  </h3>
                  {today.length === 0 ? (
                    <p className="text-[11px] text-xp-text/60 py-4 text-center">Sem agendamentos hoje.</p>
                  ) : (
                    <div className="max-h-[420px] overflow-y-auto">
                      <table className="w-full text-[12px] bg-white shadow-xpRaised">
                        <thead className="bg-xp-paperDark sticky top-0">
                          <tr>
                            <th className="text-left p-2 w-20">Hora</th>
                            <th className="text-left p-2">Cliente</th>
                            <th className="text-left p-2">Barbeiro</th>
                            <th className="text-left p-2">Serviço</th>
                            <th className="text-left p-2 w-32">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {today.map(a => (
                            <tr key={a.id} className="border-t border-xp-paperDark/60 hover:bg-xp-paper/30">
                              <td className="p-2 font-mono font-bold">{format(parseISO(a.startsAt), 'HH:mm')}</td>
                              <td className="p-2">—</td>
                              <td className="p-2">{a.barberId.slice(0, 6)}</td>
                              <td className="p-2">—</td>
                              <td className="p-2">
                                <span className={[
                                  'text-[10px] uppercase px-1.5 py-0.5',
                                  a.status === 'CONFIRMED' && 'bg-xp-sky text-white',
                                  a.status === 'COMPLETED' && 'bg-xp-green text-white',
                                  a.status === 'CANCELLED' && 'bg-xp-red text-white',
                                  a.status === 'PENDING' && 'bg-yellow-500 text-white',
                                ].filter(Boolean).join(' ')}>
                                  {a.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <aside className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
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

                  <div>
                    <h3 className="text-[13px] font-bold mb-2">Equipe ({staff.length})</h3>
                    <div className="max-h-[300px] overflow-y-auto pr-1 space-y-1">
                      {staff.map(s => (
                        <div key={s.id} className="bg-white p-2 shadow-xpRaised text-[11px]">
                          <div className="font-bold truncate">{s.name}</div>
                          <div className="text-xp-text/70 truncate">{s.email}</div>
                          <div className="text-[10px] uppercase text-xp-sky mt-1">{s.role}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={signOut} className="w-full">Sair</Button>
                </aside>
              </div>
            )}

            {/* ─── ABA CONTROLES DO DONO ──────────────────────── */}
            {tab === 'controles' && (
              <div>
                {/* Sub-TabStrip */}
                <div className="flex gap-1 mb-3 ml-2">
                  {(['produtos', 'equipe'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setSubTab(t)}
                      className={[
                        'px-3 py-1 text-[11px]',
                        subTab === t
                          ? 'bg-xp-sky text-white font-bold'
                          : 'bg-xp-paperDark text-xp-text hover:bg-xp-paper',
                      ].join(' ')}
                    >
                      {t === 'produtos' ? '🛍️ Produtos' : '👥 Equipe'}
                    </button>
                  ))}
                </div>

                {/* Sub-aba PRODUTOS */}
                {subTab === 'produtos' && (
                  <>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <div className="bg-white p-2 shadow-xpRaised">
                        <div className="text-[10px] text-xp-text/60 uppercase">SKUs</div>
                        <div className="text-[16px] font-bold text-xp-sky">{totalSkus}</div>
                      </div>
                      <div className="bg-white p-2 shadow-xpRaised">
                        <div className="text-[10px] text-xp-text/60 uppercase">Estoque baixo</div>
                        <div className={['text-[16px] font-bold', lowStockCount > 0 ? 'text-yellow-600' : 'text-xp-green'].join(' ')}>
                          {lowStockCount}
                        </div>
                      </div>
                      <div className="bg-white p-2 shadow-xpRaised">
                        <div className="text-[10px] text-xp-text/60 uppercase">Esgotados</div>
                        <div className={['text-[16px] font-bold', outOfStock > 0 ? 'text-xp-red' : 'text-xp-green'].join(' ')}>
                          {outOfStock}
                        </div>
                      </div>
                      <div className="bg-white p-2 shadow-xpRaised">
                        <div className="text-[10px] text-xp-text/60 uppercase">Valor estoque</div>
                        <div className="text-[12px] font-bold text-xp-green">{formatBRL(stockValue / 100)}</div>
                      </div>
                    </div>

                    <table className="w-full text-[12px] bg-white shadow-xpRaised">
                      <thead className="bg-xp-paperDark">
                        <tr>
                          <th className="text-left p-2">Produto</th>
                          <th className="text-left p-2">SKU</th>
                          <th className="text-right p-2 w-24">Preço</th>
                          <th className="text-center p-2 w-28">Estoque</th>
                          <th className="text-center p-2 w-32">Status</th>
                          <th className="text-center p-2 w-24">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(p => (
                          <tr key={p.id} className="border-t border-xp-paperDark/60">
                            <td className="p-2">
                              <div className="font-bold">{p.name}</div>
                              <div className="text-[10px] text-xp-text/60">{p.category}</div>
                            </td>
                            <td className="p-2 font-mono text-[11px]">{p.sku ?? '—'}</td>
                            <td className="p-2 text-right font-bold">{formatBRL(p.retailPriceCents / 100)}</td>
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                value={p.currentStock}
                                onChange={(e) => handleStockChange(p.id, Number(e.target.value))}
                                className={[
                                  'w-16 px-1 py-0.5 text-center font-mono',
                                  'shadow-[inset_1px_1px_0_#7a7a7a,inset_-1px_-1px_0_#ffffff]',
                                  p.currentStock === 0 ? 'text-xp-red font-bold'
                                   : p.currentStock <= p.lowStockThreshold ? 'text-yellow-600 font-bold'
                                   : 'text-xp-text',
                                ].join(' ')}
                                min="0"
                              />
                              <span className="text-[10px] text-xp-text/50 ml-1">/ {p.lowStockThreshold}</span>
                            </td>
                            <td className="p-2 text-center">
                              <span className={[
                                'text-[10px] uppercase px-1.5 py-0.5',
                                p.isActive ? 'bg-xp-green text-white' : 'bg-xp-paperDark text-xp-text/50',
                              ].join(' ')}>
                                {p.isActive ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => handleToggleActive(p.id, p.isActive)}
                                className="text-[10px] text-xp-sky hover:underline"
                              >
                                {p.isActive ? 'Desativar' : 'Ativar'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {/* Sub-aba EQUIPE (comissões editáveis) */}
                {subTab === 'equipe' && (
                  <div className="space-y-2">
                    {staff.map(s => (
                      <div key={s.id} className="bg-white p-3 shadow-xpRaised">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-bold text-[14px]">{s.name}</div>
                            <div className="text-[11px] text-xp-text/70">{s.email}</div>
                            <div className="text-[10px] uppercase text-xp-sky mt-1">{s.role}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            {s.commissionPct !== null && (
                              <div className="text-right">
                                <div className="text-[10px] text-xp-text/60 uppercase">Comissão</div>
                                <div className="text-[16px] font-bold text-xp-green">
                                  {(s.commissionPct / 100).toFixed(2)}%
                                </div>
                              </div>
                            )}
                            {s.role === 'BARBER' && (
                              <Button
                                onClick={() => setEditing({
                                  id: s.id,
                                  initials: s.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(),
                                  specialty: '',
                                  commissionPct: s.commissionPct ?? 5000,
                                })}
                                className="text-[11px]"
                              >
                                Editar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Window>

      <CommissionEditor
        barber={editing}
        onClose={() => setEditing(null)}
        onSaved={(updated) => {
          handleSaved({
            ...staff.find(s => s.id === updated.id)!,
            commissionPct: updated.commissionPct,
          });
          setEditing(null);
        }}
      />
    </div>
  );
}
