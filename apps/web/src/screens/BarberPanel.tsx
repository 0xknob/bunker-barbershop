// BarberPanel — painel profissional do barbeiro.
//
// FONTE de dados: GET /api/barbers/me/dashboard (calculado no backend).
//
// Métricas seguem padrão da industria (Fresha Performance Summary Report:
// https://www.fresha.com/help-center/knowledge-base/reports/344-performance-summary-article-1):
// - Comissão por período (today/week/month)
// - Receita + serviços realizados + ticket médio
// - Agenda do dia (status badges coloridos)
// - Top serviços
//
// Em v0.4: occupancy rate, top clients, % cancel/no-show
//
// Layout com TabStrip XP (multi-aba com state preservado).

import { useEffect, useState } from 'react';
import { format, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Window } from '../components/ui/Window';
import { TaskbarButton } from '../components/ui/TaskbarButton';
import { Button } from '../components/ui/Button';
import { formatBRL } from '../lib/format';
import { useAuth } from '../auth/AuthProvider';

const API = '/api';

interface BarberInfo { id: string; initials: string; specialty: string; commissionPct: number; }
interface Stats {
  completedCount: number; cancelledCount: number; noShowCount: number;
  totalRevenueCents: number; commissionCents: number;
  totalDurationMin: number; averageTicketCents: number;
}
interface TodayAppt {
  id: string;
  time: string;
  status: string;
  priceCents: number;
  serviceName: string;
  customerId: string;
}
interface TopService { name: string; count: number; revenueCents: number; durationLabel: string; }
interface Dashboard {
  barber: BarberInfo;
  stats: { today: Stats; week: Stats; month: Stats; allTime: Stats };
  todayAppointments: TodayAppt[];
  topServices: TopService[];
  formattedDuration: { today: string; week: string; month: string };
}

type Tab = 'overview' | 'agenda' | 'servicos';

export function BarberPanel() {
  const { signOut, user } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/barbers/me/dashboard`, { credentials: 'include' });
      if (res.status === 404) {
        setError('Você ainda não tem perfil de barbeiro cadastrado.');
        return;
      }
      if (!res.ok) {
        setError(`Erro ${res.status}`);
        return;
      }
      setData(await res.json());
      setError(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return <PainelCarregando />;
  }
  if (error || !data) {
    return <PainelErro mensagem={error ?? 'Sem dados'} signOut={signOut} />;
  }

  const { barber, stats, todayAppointments, topServices, formattedDuration } = data;
  const commissionPctLabel = (barber.commissionPct / 100).toFixed(2);
  const valueColor = (v: number) => v > 0 ? 'text-xp-green' : 'text-xp-text/40';

  return (
    <div className="fixed inset-0 flex flex-col bg-[#008080]">
      {/* Conteúdo */}
      <div className="flex-1 flex items-center justify-center p-4 pb-2 overflow-auto">
        <Window
          title={`Painel do Barbeiro — ${user?.name}`}
          width="min(1100px, 96vw)"
        >
          {/* KPI strip com 4 cards grandes no topo (sempre visível) */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <KPICard
              label="Comissão hoje"
              value={formatBRL(stats.today.commissionCents / 100)}
              sub={`${commissionPctLabel}% × ${formatBRL(stats.today.totalRevenueCents / 100)}`}
              highlight="primary"
              dim={stats.today.completedCount === 0}
            />
            <KPICard
              label="Serviços hoje"
              value={String(stats.today.completedCount)}
              sub={`${stats.today.cancelledCount} canc. · ${stats.today.noShowCount} no-show`}
              dim={stats.today.completedCount === 0}
            />
            <KPICard
              label="Receita do dia"
              value={formatBRL(stats.today.totalRevenueCents / 100)}
              sub={formattedDuration.today}
              dim={stats.today.completedCount === 0}
            />
            <KPICard
              label="Ticket médio (mês)"
              value={formatBRL(stats.month.averageTicketCents / 100)}
              sub={`${stats.month.completedCount} serviços no mês`}
              dim={stats.month.completedCount === 0}
            />
          </div>

          {/* TabStrip XP — Agenda | Visão geral | Serviços */}
          <div className="flex gap-0 mb-3 border-b border-xp-chromeShadow">
            {([
              ['overview', '📈 Visão geral'],
              ['agenda',   '📅 Agenda de hoje'],
              ['servicos', '💈 Meus serviços'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id as Tab)}
                className={[
                  'px-4 py-1.5 text-[12px]',
                  tab === id
                    ? 'bg-xp-paper shadow-xpRaised border-b-2 border-xp-sky font-bold'
                    : 'bg-xp-paperDark hover:bg-xp-paper/50',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ─── ABA VISÃO GERAL ───────────────────────────── */}
          {tab === 'overview' && (
            <div className="grid grid-cols-[1fr_300px] gap-4">
              <section>
                <h3 className="text-[13px] font-bold mb-2">📊 Resumo financeiro (mês)</h3>
                <table className="w-full text-[12px] bg-white shadow-xpRaised">
                  <thead className="bg-xp-paperDark">
                    <tr>
                      <th className="text-left p-2">Métrica</th>
                      <th className="text-right p-2 w-24">Hoje</th>
                      <th className="text-right p-2 w-24">Semana</th>
                      <th className="text-right p-2 w-24">Mês</th>
                      <th className="text-right p-2 w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-xp-paperDark/60">
                      <td className="p-2">Serviços concluídos</td>
                      <td className="p-2 text-right font-mono">{stats.today.completedCount}</td>
                      <td className="p-2 text-right font-mono">{stats.week.completedCount}</td>
                      <td className="p-2 text-right font-mono">{stats.month.completedCount}</td>
                      <td className="p-2 text-right font-mono font-bold">{stats.allTime.completedCount}</td>
                    </tr>
                    <tr className="border-t border-xp-paperDark/60">
                      <td className="p-2">Receita</td>
                      <td className={['p-2 text-right font-bold', valueColor(stats.today.totalRevenueCents)].join(' ')}>
                        {formatBRL(stats.today.totalRevenueCents / 100)}
                      </td>
                      <td className={['p-2 text-right font-bold', valueColor(stats.week.totalRevenueCents)].join(' ')}>
                        {formatBRL(stats.week.totalRevenueCents / 100)}
                      </td>
                      <td className={['p-2 text-right font-bold', valueColor(stats.month.totalRevenueCents)].join(' ')}>
                        {formatBRL(stats.month.totalRevenueCents / 100)}
                      </td>
                      <td className="p-2 text-right font-bold">{formatBRL(stats.allTime.totalRevenueCents / 100)}</td>
                    </tr>
                    <tr className="border-t border-xp-paperDark/60 bg-xp-paper/40">
                      <td className="p-2 font-bold">💰 Sua comissão</td>
                      <td className={['p-2 text-right font-mono font-bold', valueColor(stats.today.commissionCents)].join(' ')}>
                        {formatBRL(stats.today.commissionCents / 100)}
                      </td>
                      <td className={['p-2 text-right font-mono font-bold', valueColor(stats.week.commissionCents)].join(' ')}>
                        {formatBRL(stats.week.commissionCents / 100)}
                      </td>
                      <td className={['p-2 text-right font-mono font-bold', valueColor(stats.month.commissionCents)].join(' ')}>
                        {formatBRL(stats.month.commissionCents / 100)}
                      </td>
                      <td className="p-2 text-right font-mono font-bold">{formatBRL(stats.allTime.commissionCents / 100)}</td>
                    </tr>
                    <tr className="border-t border-xp-paperDark/60">
                      <td className="p-2">Tempo trabalhado</td>
                      <td className="p-2 text-right">{formattedDuration.today}</td>
                      <td className="p-2 text-right">{formattedDuration.week}</td>
                      <td className="p-2 text-right">{formattedDuration.month}</td>
                      <td className="p-2 text-right text-xp-text/50">—</td>
                    </tr>
                    <tr className="border-t border-xp-paperDark/60">
                      <td className="p-2">Cancelamentos</td>
                      <td className="p-2 text-right text-xp-red">{stats.today.cancelledCount}</td>
                      <td className="p-2 text-right text-xp-red">{stats.week.cancelledCount}</td>
                      <td className="p-2 text-right text-xp-red">{stats.month.cancelledCount}</td>
                      <td className="p-2 text-right text-xp-red">{stats.allTime.cancelledCount}</td>
                    </tr>
                    <tr className="border-t border-xp-paperDark/60">
                      <td className="p-2">No-show</td>
                      <td className="p-2 text-right text-xp-red">{stats.today.noShowCount}</td>
                      <td className="p-2 text-right text-xp-red">{stats.week.noShowCount}</td>
                      <td className="p-2 text-right text-xp-red">{stats.month.noShowCount}</td>
                      <td className="p-2 text-right text-xp-red">{stats.allTime.noShowCount}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Comissão em destaque */}
                <div className="mt-4 bg-gradient-to-b from-xp-sky to-xp-skyDark text-white p-4 shadow-xpRaised">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-wide opacity-80">Sua comissão (acumulada no mês)</div>
                      <div className="text-[28px] font-bold mt-1">
                        {formatBRL(stats.month.commissionCents / 100)}
                      </div>
                      <div className="text-[11px] opacity-80 mt-1">
                        Taxa atual: <b>{commissionPctLabel}%</b> · {stats.month.completedCount} serviços
                      </div>
                    </div>
                    <div className="text-[40px] opacity-70">💰</div>
                  </div>
                </div>
              </section>

              {/* Sidebar: top serviços */}
              <aside>
                <h3 className="text-[13px] font-bold mb-2">🏆 Top serviços (mês)</h3>
                {topServices.length === 0 ? (
                  <p className="text-[11px] text-xp-text/60 py-3 text-center">
                    Sem serviços completados no mês ainda.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {topServices.map((t, i) => (
                      <div key={t.name} className="bg-white p-2 shadow-xpRaised flex items-center justify-between text-[12px]">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={[
                              'w-5 h-5 flex items-center justify-center text-[11px] font-bold',
                              i === 0 ? 'bg-yellow-400' : 'bg-xp-paperDark',
                            ].join(' ')}>
                              {i + 1}
                            </span>
                            <span className="font-bold truncate">{t.name}</span>
                          </div>
                          <div className="text-[10px] text-xp-text/60 mt-0.5">
                            {t.durationLabel}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{t.count}x</div>
                          <div className="text-[10px] text-xp-green">{formatBRL(t.revenueCents / 100)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 bg-white p-2 shadow-xpRaised text-[11px]">
                  <div className="font-bold mb-1">📅 Hoje</div>
                  <div className="text-xp-text/70">
                    {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </div>
                  <div className="mt-1">
                    {todayAppointments.length === 0
                      ? <span className="text-xp-text/50">Dia livre</span>
                      : <span>{todayAppointments.length} agendamento(s)</span>}
                  </div>
                </div>
              </aside>
            </div>
          )}

          {/* ─── ABA AGENDA DE HOJE ─────────────────────────── */}
          {tab === 'agenda' && (
            <div>
              <h3 className="text-[13px] font-bold mb-2">
                Sua agenda — {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h3>
              {todayAppointments.length === 0 ? (
                <p className="text-[12px] text-xp-text/60 py-6 text-center">
                  Nenhum agendamento pra hoje. Dia livre! 🏖️
                </p>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-[12px] bg-white shadow-xpRaised">
                    <thead className="bg-xp-paperDark sticky top-0">
                      <tr>
                        <th className="text-left p-2 w-20">Hora</th>
                        <th className="text-left p-2">Serviço</th>
                        <th className="text-left p-2">Cliente</th>
                        <th className="text-right p-2 w-24">Valor</th>
                        <th className="text-left p-2 w-32">Status</th>
                        <th className="text-left p-2 w-32">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayAppointments.map(a => (
                        <tr key={a.id} className="border-t border-xp-paperDark/60">
                          <td className="p-2 font-mono font-bold">{a.time}</td>
                          <td className="p-2">{a.serviceName}</td>
                          <td className="p-2 text-xp-text/70 text-[11px]">
                            {a.customerId.includes('@') ? a.customerId : `Cliente #${a.customerId.slice(0, 6)}`}
                          </td>
                          <td className="p-2 text-right font-bold text-xp-green">
                            {formatBRL(a.priceCents / 100)}
                          </td>
                          <td className="p-2">
                            <span className={[
                              'text-[10px] uppercase px-1.5 py-0.5 font-bold',
                              a.status === 'PENDING'   && 'bg-yellow-500 text-white',
                              a.status === 'CONFIRMED' && 'bg-xp-sky text-white',
                              a.status === 'COMPLETED' && 'bg-xp-green text-white',
                              a.status === 'CANCELLED' && 'bg-xp-red text-white',
                              a.status === 'NO_SHOW'    && 'bg-xp-redDark text-white',
                            ].filter(Boolean).join(' ')}>
                              {a.status}
                            </span>
                          </td>
                          <td className="p-2">
                            {a.status === 'PENDING' && (
                              <button
                                onClick={() => updateStatus(a.id, 'CONFIRMED')}
                                className="text-[10px] text-xp-sky hover:underline mr-2"
                              >
                                Confirmar
                              </button>
                            )}
                            {a.status === 'CONFIRMED' && (
                              <button
                                onClick={() => updateStatus(a.id, 'COMPLETED')}
                                className="text-[10px] text-xp-green hover:underline"
                              >
                                Concluir
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ─── ABA MEUS SERVIÇOS ──────────────────────────── */}
          {tab === 'servicos' && (
            <div>
              <h3 className="text-[13px] font-bold mb-2">📋 Estatísticas de serviços</h3>
              <table className="w-full text-[12px] bg-white shadow-xpRaised">
                <thead className="bg-xp-paperDark">
                  <tr>
                    <th className="text-left p-2">Serviço</th>
                    <th className="text-center p-2 w-20">Duração</th>
                    <th className="text-right p-2 w-24">Qtd. no mês</th>
                    <th className="text-right p-2 w-28">Receita no mês</th>
                  </tr>
                </thead>
                <tbody>
                  {topServices.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-xp-text/60">
                      Nenhum serviço realizado no mês ainda.
                    </td></tr>
                  ) : topServices.map(t => (
                    <tr key={t.name} className="border-t border-xp-paperDark/60">
                      <td className="p-2 font-bold">{t.name}</td>
                      <td className="p-2 text-center text-xp-text/70">{t.durationLabel}</td>
                      <td className="p-2 text-right font-mono">{t.count}</td>
                      <td className="p-2 text-right font-bold text-xp-green">{formatBRL(t.revenueCents / 100)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 className="text-[13px] font-bold mt-4 mb-2">💈 Vendas de produtos (em breve)</h3>
              <div className="bg-xp-paper p-4 shadow-xpRaised text-center text-xp-text/70">
                <div className="text-[32px] mb-2">📦</div>
                <p className="text-[12px]">
                  O registro de vendas de produtos por barbeiro chega na v0.4.
                  <br />
                  Enquanto isso, vendas de retail ficam registradas no painel do Dono.
                </p>
              </div>
            </div>
          )}
        </Window>
      </div>

      {/* Taskbar XP — navegação entre abas + sair */}
      <footer className="bg-gradient-to-b from-xp-taskbarLight to-xp-taskbar border-t border-xp-skyDark px-2 py-1 flex gap-1 shrink-0">
        <TaskbarButton
          icon="📈"
          label="Visão geral"
          active={tab === 'overview'}
          onClick={() => setTab('overview')}
        />
        <TaskbarButton
          icon="📅"
          label="Agenda"
          active={tab === 'agenda'}
          onClick={() => setTab('agenda')}
        />
        <TaskbarButton
          icon="💈"
          label="Meus serviços"
          active={tab === 'servicos'}
          onClick={() => setTab('servicos')}
        />
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
    </div>
  );

  async function updateStatus(todayApptId: string, newStatus: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW') {
    // todayAppt.id é string tipo "{serviceId}-{ts}" — reconstruímos o appointmentId real
    // a partir do todayAppointments. Como simplificação v0.3, só recarregamos.
    await load();
    // Em v0.4: implementar PATCH /api/appointments/:id com status + audit log
  }
}

// ─── Sub-componentes ─────────────────────────────────────────────
function KPICard({ label, value, sub, highlight, dim }: {
  label: string; value: string; sub?: string;
  highlight?: 'primary'; dim?: boolean;
}) {
  return (
    <div className={[
      'shadow-xpRaised p-3 flex flex-col',
      highlight === 'primary'
        ? 'bg-gradient-to-b from-xp-sky to-xp-skyDark text-white'
        : 'bg-white text-xp-text',
      dim ? 'opacity-60' : '',
    ].join(' ')}>
      <div className={[
        'text-[10px] uppercase tracking-wide mb-1',
        highlight === 'primary' ? 'opacity-90' : 'text-xp-text/60',
      ].join(' ')}>
        {label}
      </div>
      <div className={[
        'text-[18px] font-bold leading-tight',
        highlight === 'primary' ? '' : 'text-xp-sky',
      ].join(' ')}>
        {value}
      </div>
      {sub && (
        <div className={[
          'text-[10px] mt-1',
          highlight === 'primary' ? 'opacity-80' : 'text-xp-text/60',
        ].join(' ')}>
          {sub}
        </div>
      )}
    </div>
  );
}

function PainelCarregando() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#008080]">
      <Window title="Carregando painel...">
        <p className="text-[12px]">Buscando dados...</p>
      </Window>
    </div>
  );
}

function PainelErro({ mensagem, signOut }: { mensagem: string; signOut: () => void }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#008080]">
      <Window title="Erro no painel">
        <p className="text-[12px] text-xp-red mb-3">⚠ {mensagem}</p>
        <Button onClick={signOut} variant="primary">Voltar</Button>
      </Window>
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
