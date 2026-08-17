// Painel do Dono — layout com barra de tarefas XP na parte inferior.
//
// MULTI-ABA: cada janela (Agenda, Controles) abre/fecha independentemente.
// Quando você entra em uma aba, ela ADICIONA à taskbar. Quando fecha (×),
// ela é REMOVIDA. Para reabrir, clica no botão "Abrir X" correspondente.
//
// State preservado: ao trocar entre janelas, conteúdo (scroll, sub-aba, etc)
// NÃO é perdido — porque as janelas são renderizadas condicionalmente baseado
// em "está aberta?", não no "ativo atual". Quando reabre, volta do mesmo ponto.

import { useEffect, useState } from 'react';
import { format, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Window } from '../components/ui/Window';
import { TaskbarButton } from '../components/ui/TaskbarButton';
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

type SubTab = 'produtos' | 'equipe';

/** Estado de cada janela individualmente — preservado entre aberturas. */
interface WindowState<T> {
  open: boolean;
  minimized: boolean; // minimizado na taskbar, sem fechar
  data: T;
}

function newWin<T>(initial: T): WindowState<T> {
  return { open: false, minimized: false, data: initial };
}

export function OwnerPanel() {
  const { signOut, user } = useAuth();

  // Janelas independentes — abre/fecha/fecha sem perder state interno
  const [agendaWin, setAgendaWin]     = useState<WindowState<{ today: Appointment[]; completed: number; cancelled: number; revenue: number; noShowRate: number; staff: StaffMember[] }>>(newWin({ today: [], completed: 0, cancelled: 0, revenue: 0, noShowRate: 0, staff: [] }));
  const [controlesWin, setControlesWin] = useState<WindowState<{ subTab: SubTab; products: Product[]; staff: StaffMember[]; totalSkus: number; lowStock: number; outOfStock: number; stockValue: number }>>(
    newWin({ subTab: 'produtos', products: [], staff: [], totalSkus: 0, lowStock: 0, outOfStock: 0, stockValue: 0 })
  );

  // Active = qual está visível no centro (popup por cima). null = só os botões
  const [active, setActive] = useState<'agenda' | 'controles' | null>(null);
  const [editing, setEditing] = useState<StaffMember | null>(null);

  // Carrega dados uma vez (compartilhado entre janelas — sem refetch ao alternar)
  const [staff, setStaff]       = useState<StaffMember[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [appts, setAppts]       = useState<Appointment[]>([]);
  const [loading, setLoading]   = useState(true);

  async function loadAll() {
    const [a, s, p] = await Promise.all([
      fetch(`${API}/appointments`).then(r => r.json()),
      fetch(`${API}/users/staff`).then(r => r.json()),
      fetch(`${API}/products?all=true`).then(r => r.json()),
    ]);
    const apptsArr: Appointment[]    = Array.isArray(a) ? a : [];
    const staffArr: StaffMember[]   = Array.isArray(s) ? s : [];
    const prodsArr: Product[]       = Array.isArray(p) ? p : [];
    setAppts(apptsArr);
    setStaff(staffArr);
    setProducts(prodsArr);
    // Atualiza janela de Agenda
    const todayArr      = apptsArr.filter(x => isToday(parseISO(x.startsAt)));
    const completedArr  = apptsArr.filter(x => x.status === 'COMPLETED');
    const cancelledArr  = apptsArr.filter(x => x.status === 'CANCELLED');
    const revenueArr    = completedArr.reduce((s, x) => s + x.priceCents, 0);
    const noShowRateArr = apptsArr.length > 0 ? Math.round((cancelledArr.length / apptsArr.length) * 100) : 0;
    setAgendaWin(w => ({ ...w, data: { today: todayArr, completed: completedArr.length, cancelled: cancelledArr.length, revenue: revenueArr, noShowRate: noShowRateArr, staff: staffArr } }));

    // Atualiza janela de Controles
    const totalSkusArr    = prodsArr.length;
    const lowStockArr     = prodsArr.filter(x => x.currentStock <= x.lowStockThreshold).length;
    const outOfStockArr   = prodsArr.filter(x => x.currentStock === 0).length;
    const stockValueArr   = prodsArr.reduce((s, x) => s + (x.retailPriceCents * x.currentStock), 0);
    setControlesWin(w => ({ ...w, data: { ...w.data, products: prodsArr, staff: staffArr, totalSkus: totalSkusArr, lowStock: lowStockArr, outOfStock: outOfStockArr, stockValue: stockValueArr } }));
  }

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
  }, []);

  // ── Handlers de ação sincronizam state entre janelas ───────────
  async function handleStockChange(productId: string, newStock: number) {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, currentStock: newStock } : p));
    // Reaplica no controlesWin também
    setControlesWin(w => ({
      ...w,
      data: {
        ...w.data,
        products: w.data.products.map(p => p.id === productId ? { ...p, currentStock: newStock } : p),
        outOfStock: w.data.products.filter(p => p.id === productId ? newStock === 0 : p.currentStock === 0).length,
        lowStock:  w.data.products.filter(p => p.id === productId ? newStock <= p.lowStockThreshold : p.currentStock <= p.lowStockThreshold).length,
      },
    }));
    await fetch(`${API}/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentStock: newStock }),
    });
  }

  async function handleToggleActive(productId: string, currentActive: boolean) {
    const newActive = !currentActive;
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, isActive: newActive } : p));
    setControlesWin(w => ({ ...w, data: { ...w.data, products: w.data.products.map(p => p.id === productId ? { ...p, isActive: newActive } : p) } }));
    await fetch(`${API}/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: newActive }),
    });
  }

  // ── Controles da taskbar ───────────────────────────────────────
  function openAgenda() {
    setAgendaWin(w => ({ ...w, open: true, minimized: false }));
    setActive('agenda');
  }
  function openControles() {
    setControlesWin(w => ({ ...w, open: true, minimized: false }));
    setActive('controles');
  }
  function focusAgenda() {
    setAgendaWin(w => ({ ...w, minimized: false }));
    setActive('agenda');
  }
  function focusControles() {
    setControlesWin(w => ({ ...w, minimized: false }));
    setActive('controles');
  }
  function closeAgenda() {
    setAgendaWin(w => ({ ...w, open: false, minimized: false }));
    if (active === 'agenda') {
      // Ativa a outra janela se existir
      if (controlesWin.open) focusControles();
      else setActive(null);
    }
  }
  function closeControles() {
    setControlesWin(w => ({ ...w, open: false, minimized: false }));
    if (active === 'controles') {
      if (agendaWin.open) focusAgenda();
      else setActive(null);
    }
  }
  function handleSaved(updated: StaffMember) {
    setStaff(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
    setAgendaWin(w => ({ ...w, data: { ...w.data, staff: w.data.staff.map(s => s.id === updated.id ? { ...s, ...updated } : s) } }));
    setControlesWin(w => ({ ...w, data: { ...w.data, staff: w.data.staff.map(s => s.id === updated.id ? { ...s, ...updated } : s) } }));
  }

  // ── Calcular posição de cada janela (estilo cascata) ─────────
  // Quando só uma aberta: centralizada. Quando duas: cascata diagonal.
  const openedCount = (agendaWin.open ? 1 : 0) + (controlesWin.open ? 1 : 0);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#008080]">
      {/* Área de conteúdo — vazia se nenhuma janela ativa, mostra "desktop" XP */}
      <div className="flex-1 flex items-center justify-center p-4 pb-2 overflow-hidden">
        {openedCount === 0 ? (
          /* Desktop vazio — mensagem de boas-vindas com botões pra abrir */
          <div className="bg-xp-paper border border-xp-chromeShadow shadow-xpRaised p-6 max-w-[400px] text-center">
            <div className="text-5xl mb-3">⚙️</div>
            <h1 className="text-[18px] font-bold mb-2" style={{ fontFamily: 'Trebuchet MS' }}>
              Painel do Dono
            </h1>
            <p className="text-[12px] text-xp-text/70 mb-4">
              Bem-vindo, {user?.name}. Use a barra de tarefas abaixo pra
              abrir as ferramentas.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={openAgenda}
                className="px-4 py-1.5 bg-xp-sky text-white text-[13px] font-bold shadow-xpRaised active:shadow-xpPressed"
              >
                📅 Abrir Agenda
              </button>
              <button
                onClick={openControles}
                className="px-4 py-1.5 bg-xp-paper text-xp-text text-[13px] font-bold shadow-xpRaised active:shadow-xpPressed"
              >
                ⚙️ Abrir Controles
              </button>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Janela AGENDA — renderizada condicionalmente, state preservado */}
            {agendaWin.open && (
              <div
                className="absolute"
                style={{
                  zIndex: active === 'agenda' ? 10 : 5,
                  left:   openedCount === 2 ? '8%' : '50%',
                  top:    '4%',
                  transform: openedCount === 2 ? 'none' : 'translateX(-50%)',
                }}
              >
                <Window
                  title={`Agenda — ${format(new Date(), "dd 'de' MMMM", { locale: ptBR })}`}
                  onClose={closeAgenda}
                  width="min(900px, 90vw)"
                >
                  {loading ? (
                    <p className="text-[12px]">Carregando...</p>
                  ) : (
                    <AgendaContent
                      today={agendaWin.data.today}
                      completed={agendaWin.data.completed}
                      cancelled={agendaWin.data.cancelled}
                      revenue={agendaWin.data.revenue}
                      noShowRate={agendaWin.data.noShowRate}
                      staff={agendaWin.data.staff}
                    />
                  )}
                </Window>
              </div>
            )}

            {/* Janela CONTROLES — renderizada condicionalmente */}
            {controlesWin.open && (
              <div
                className="absolute"
                style={{
                  zIndex: active === 'controles' ? 10 : 5,
                  left:   openedCount === 2 ? '12%' : '50%',
                  top:    '4%',
                  transform: openedCount === 2 ? 'none' : 'translateX(-50%)',
                }}
              >
                <Window
                  title="Controles do Dono"
                  onClose={closeControles}
                  width="min(1100px, 92vw)"
                >
                  <ControlesContent
                    win={controlesWin}
                    setWin={setControlesWin}
                    staff={staff}
                    onEditCommission={setEditing}
                    onStockChange={handleStockChange}
                    onToggleActive={handleToggleActive}
                  />
                </Window>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Taskbar XP — sempre visível */}
      <footer className="bg-gradient-to-b from-xp-taskbarLight to-xp-taskbar border-t border-xp-skyDark px-2 py-1 flex gap-1 shrink-0">
        {/* Agenda — só mostra quando aberta */}
        {agendaWin.open && (
          <TaskbarButton
            icon="📅"
            label="Agenda"
            active={active === 'agenda'}
            onClick={focusAgenda}
            onClose={closeAgenda}
          />
        )}
        {controlesWin.open && (
          <TaskbarButton
            icon="⚙️"
            label="Controles do Dono"
            active={active === 'controles'}
            onClick={focusControles}
            onClose={closeControles}
          />
        )}

        {/* Botões "Abrir X" quando a janela correspondente está fechada */}
        {!agendaWin.open && (
          <button
            onClick={openAgenda}
            className="flex items-center gap-2 px-3 py-1 min-w-[120px] text-white text-[12px] font-bold bg-gradient-to-b from-xp-taskbarLight to-xp-taskbar shadow-xpRaised hover:brightness-110"
          >
            <span>📅</span>
            <span className="truncate">Abrir Agenda</span>
          </button>
        )}
        {!controlesWin.open && (
          <button
            onClick={openControles}
            className="flex items-center gap-2 px-3 py-1 min-w-[160px] text-white text-[12px] font-bold bg-gradient-to-b from-xp-taskbarLight to-xp-taskbar shadow-xpRaised hover:brightness-110"
          >
            <span>⚙️</span>
            <span className="truncate">Abrir Controles</span>
          </button>
        )}

        <div className="ml-auto flex items-center px-3 text-white text-[12px] font-bold gap-3">
          <span>{user?.name}</span>
          <Clock />
          <button
            onClick={signOut}
            className="text-[11px] px-2 py-0.5 bg-xp-paper text-black shadow-xpRaised active:shadow-xpPressed"
          >
            Sair
          </button>
        </div>
      </footer>

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

// ─── Sub-componente AGENDA (preserva state entre re-renders) ──────────
function AgendaContent({
  today, completed, cancelled, revenue, noShowRate, staff,
}: {
  today: Appointment[]; completed: number; cancelled: number; revenue: number; noShowRate: number; staff: StaffMember[];
}) {
  return (
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
            <div className="text-[16px] font-bold text-xp-green">{completed}</div>
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
      </aside>
    </div>
  );
}

// ─── Sub-componente CONTROLES (state interno preservado) ──────────
function ControlesContent({
  win, setWin, staff, onEditCommission, onStockChange, onToggleActive,
}: {
  win: WindowState<{
    subTab: SubTab; products: Product[]; staff: StaffMember[];
    totalSkus: number; lowStock: number; outOfStock: number; stockValue: number;
  }>;
  setWin: React.Dispatch<React.SetStateAction<typeof win>>;
  staff: StaffMember[];
  onEditCommission: (s: StaffMember) => void;
  onStockChange: (id: string, n: number) => void;
  onToggleActive: (id: string, current: boolean) => void;
}) {
  const { subTab, products } = win.data;

  return (
    <div>
      <div className="flex gap-1 mb-3 ml-2">
        {(['produtos', 'equipe'] as const).map(t => (
          <button
            key={t}
            onClick={() => setWin(w => ({ ...w, data: { ...w.data, subTab: t } }))}
            className={[
              'px-3 py-1 text-[11px]',
              subTab === t ? 'bg-xp-sky text-white font-bold' : 'bg-xp-paperDark text-xp-text hover:bg-xp-paper',
            ].join(' ')}
          >
            {t === 'produtos' ? '🛍️ Produtos' : '👥 Equipe'}
          </button>
        ))}
      </div>

      {subTab === 'produtos' && (
        <>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <KPI label="SKUs" value={win.data.totalSkus} color="text-xp-sky" />
            <KPI label="Estoque baixo" value={win.data.lowStock} color={win.data.lowStock > 0 ? 'text-yellow-600' : 'text-xp-green'} />
            <KPI label="Esgotados" value={win.data.outOfStock} color={win.data.outOfStock > 0 ? 'text-xp-red' : 'text-xp-green'} />
            <KPI label="Valor estoque" value={formatBRL(win.data.stockValue / 100)} small />
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-[12px] bg-white shadow-xpRaised">
              <thead className="bg-xp-paperDark sticky top-0">
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
                        onChange={(e) => onStockChange(p.id, Number(e.target.value))}
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
                        onClick={() => onToggleActive(p.id, p.isActive)}
                        className="text-[10px] text-xp-sky hover:underline"
                      >
                        {p.isActive ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {subTab === 'equipe' && (
        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
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
                    <button
                      onClick={() => onEditCommission({
                        ...s,
                        // shape mínimo pro editor
                      } as StaffMember)}
                      className="text-[11px] text-xp-sky hover:underline"
                    >
                      Editar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, color, small }: { label: string; value: string | number; color?: string; small?: boolean }) {
  return (
    <div className="bg-white p-2 shadow-xpRaised">
      <div className="text-[10px] text-xp-text/60 uppercase">{label}</div>
      <div className={[
        small ? 'text-[12px]' : 'text-[16px]',
        'font-bold',
        color ?? 'text-xp-text',
      ].join(' ')}>
        {value}
      </div>
    </div>
  );
}

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return <span>{now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>;
}
