// LandingPage pública — 4 seções:
// 1. Hero (CTA login/cadastro/agendar)
// 2. Serviços (catálogo com preços e duração — atrativo pra novos clientes)
// 3. Produtos (catálogo de produtos à venda)
// 4. Localização + Contato
//
// Não requer auth. Quem quiser agendar ou comprar → /signup.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { formatBRL, formatDuration } from '../lib/format';

const API = '/api';

interface Product { id: string; name: string; description: string | null; category: string | null; retailPriceCents: number; currentStock: number; }
interface Service { id: string; name: string; description: string | null; durationMin: number; priceCents: number; }

export function LandingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/products`).then(r => r.json()),
      fetch(`${API}/services`).then(r => r.json()),
    ]).then(([p, s]) => {
      setProducts(Array.isArray(p) ? p : []);
      setServices(Array.isArray(s) ? s : []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#008080]">
      {/* ─── HERO ────────────────────────────────────────────────── */}
      <header className="bg-gradient-to-b from-xp-sky to-xp-skyDark text-white py-14 px-4 text-center shadow-lg">
        <div className="text-6xl mb-2">✂️</div>
        <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Trebuchet MS' }}>
          BunkerBarbershop
        </h1>
        <p className="text-lg italic opacity-90 mb-6">
          Barbearia clássica com cara de Windows XP
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/login"><Button variant="primary">Entrar</Button></Link>
          <Link to="/signup"><Button>Cadastrar</Button></Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-10">
        {/* ─── SERVIÇOS ───────────────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-2 text-center">
            💈 Nossos Serviços
          </h2>
          <p className="text-white/80 text-center text-[13px] mb-6">
            Atendimentos com profissionais especializados — sem agendamento complexo.
          </p>

          {loading ? (
            <p className="text-white text-center py-4">Carregando...</p>
          ) : services.length === 0 ? (
            <p className="text-white text-center py-4">Em breve serviços disponíveis.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {services.map(s => (
                <div key={s.id} className="bg-xp-paper shadow-xpRaised p-3 flex flex-col">
                  <div className="text-[10px] uppercase text-xp-text/60 mb-1">
                    {formatDuration(s.durationMin)}
                  </div>
                  <div className="text-[13px] font-bold text-xp-text mb-1 min-h-[2.5em]">
                    {s.name}
                  </div>
                  {s.description && (
                    <div className="text-[11px] text-xp-text/70 mb-2 line-clamp-2 flex-1">
                      {s.description}
                    </div>
                  )}
                  <div className="text-[14px] font-bold text-xp-green text-center mt-auto">
                    {formatBRL(s.priceCents / 100)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 justify-center mt-4">
            <Link to="/booking-public"><Button variant="primary">Agendar como visitante</Button></Link>
            <Link to="/signup"><Button>Criar conta</Button></Link>
            <Link to="/login"><Button>Já tenho conta</Button></Link>
          </div>
        </section>

        {/* ─── PRODUTOS ───────────────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-2 text-center">
            🛍️ Produtos à venda
          </h2>
          <p className="text-white/80 text-center text-[13px] mb-6">
            Pomadas, shampoos e óleos — pra você levar o visual bunker pra casa.
          </p>

          {loading ? (
            <p className="text-white text-center py-4">Carregando catálogo...</p>
          ) : products.length === 0 ? (
            <p className="text-white text-center py-4 opacity-80">
              Em breve produtos disponíveis.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-xp-paper shadow-xpRaised p-4 flex flex-col">
                  <div className="bg-gradient-to-b from-xp-taskbarLight to-xp-taskbar h-32 flex items-center justify-center text-4xl text-white mb-3">
                    {p.category === 'pomada' ? '🧴'
                     : p.category === 'shampoo' ? '🧴'
                     : p.category === 'oleo' ? '💧'
                     : p.category === 'kit' ? '🎁'
                     : '⚔️'}
                  </div>
                  <div className="text-[12px] uppercase text-xp-text/60 mb-1">
                    {p.category ?? 'produto'}
                  </div>
                  <div className="text-[14px] font-bold text-xp-text mb-2 min-h-[2.5em]">
                    {p.name}
                  </div>
                  {p.description && (
                    <p className="text-[11px] text-xp-text/80 mb-3 flex-1">
                      {p.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[16px] font-bold text-xp-green">
                      {formatBRL(p.retailPriceCents / 100)}
                    </span>
                    <span className={[
                      'text-[10px] uppercase px-2 py-0.5',
                      p.currentStock > 5 ? 'bg-xp-green text-white'
                       : p.currentStock > 0 ? 'bg-yellow-500 text-white'
                       : 'bg-xp-red text-white',
                    ].join(' ')}>
                      {p.currentStock > 0 ? `${p.currentStock} em estoque` : 'Esgotado'}
                    </span>
                  </div>
                  <Link to="/booking-public" className="mt-3">
                    <Button variant="primary" className="w-full" disabled={p.currentStock === 0}>
                      {p.currentStock === 0 ? 'Esgotado' : 'Comprar'}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── LOCALIZAÇÃO + CONTATO ──────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            📍 Onde estamos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mapa placeholder (XP-style "antiguidade") */}
            <div className="bg-xp-paper shadow-xpRaised p-1">
              <div className="bg-gradient-to-b from-xp-taskbarLight to-xp-taskbar p-2 text-white text-[11px] font-bold border-b border-xp-skyDark">
                Mapa — BunkerBarbershop
              </div>
              <div className="bg-xp-paperDark h-64 flex items-center justify-center relative overflow-hidden">
                {/* Placeholder de mapa — linhas tipo "ruas" */}
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  <rect width="100" height="100" fill="#d6d2c2" />
                  <line x1="0" y1="30" x2="100" y2="35" stroke="#7a7a7a" strokeWidth="0.5" />
                  <line x1="0" y1="60" x2="100" y2="58" stroke="#7a7a7a" strokeWidth="0.5" />
                  <line x1="40" y1="0" x2="42" y2="100" stroke="#7a7a7a" strokeWidth="0.5" />
                  <line x1="70" y1="0" x2="68" y2="100" stroke="#7a7a7a" strokeWidth="0.5" />
                  <circle cx="50" cy="50" r="2" fill="#b22222" />
                </svg>
                <div className="relative z-10 bg-white shadow-xpRaised p-2 text-center">
                  <div className="text-[11px] font-bold text-xp-text">📍 Aqui</div>
                  <div className="text-[10px] text-xp-text/70">
                    BunkerBarbershop
                  </div>
                </div>
              </div>
            </div>

            {/* Informações de contato */}
            <div className="bg-xp-paper shadow-xpRaised p-4">
              <div className="text-[14px] font-bold mb-3 pb-2 border-b-2 border-xp-sky">
                📞 Contato & Horário
              </div>

              <div className="space-y-2 text-[12px]">
                <div className="flex items-start gap-2">
                  <span className="font-bold w-16 shrink-0">Endereço</span>
                  <span>Rua dos Tesoureiros, 42<br />Centro · Porto Alegre/RS</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold w-16 shrink-0">Telefone</span>
                  <span>(51) 99999-1234<br />WhatsApp: (51) 99999-1234</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold w-16 shrink-0">Email</span>
                  <span>contato@bunker.dev</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold w-16 shrink-0">Horário</span>
                  <span>
                    Seg–Sex: 9h às 19h<br />
                    Sábado: 9h às 14h<br />
                    Domingo: fechado
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold w-16 shrink-0">Redes</span>
                  <span>
                    <a className="text-xp-sky underline mr-2" href="#">Instagram</a>
                    <a className="text-xp-sky underline" href="#">Facebook</a>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="bg-xp-paper shadow-xpRaised p-6 text-center">
          <h3 className="text-[20px] font-bold mb-2" style={{ fontFamily: 'Trebuchet MS' }}>
            Pronto pra ficar na régua?
          </h3>
          <p className="text-[13px] text-xp-text/70 mb-4">
            Crie sua conta em 30 segundos ou agende como visitante.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/signup"><Button variant="primary">Criar conta</Button></Link>
            <Link to="/login"><Button>Já tenho conta</Button></Link>
          </div>
        </section>
      </main>

      <footer className="text-center text-white/60 py-6 text-[11px]">
        v0.3 · Multi-tenant SaaS com RBAC e Postgres RLS · Built with XP nostalgia
      </footer>
    </div>
  );
}
