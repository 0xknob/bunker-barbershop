// LandingPage pública — catálogo de produtos + CTAs de login/signup/agendamento.
// Não requer auth. Mostra produtos ativos e visíveis online.
//
// Pra transformar em SPA de empresa (com seções hero/about), basta expandir aqui.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { formatBRL } from '../lib/format';

const API = '/api';

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  imageUrl: string | null;
  retailPriceCents: number;
  currentStock: number;
}

export function LandingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/products`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#008080]">
      {/* Hero */}
      <header className="bg-gradient-to-b from-xp-sky to-xp-skyDark text-white py-12 px-4 text-center shadow-lg">
        <div className="text-6xl mb-2">✂️</div>
        <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Trebuchet MS' }}>
          BunkerBarbershop
        </h1>
        <p className="text-lg italic opacity-90 mb-6">
          Barbearia clássica com cara de Windows XP
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/login">
            <Button variant="primary">Entrar</Button>
          </Link>
          <Link to="/signup">
            <Button>Cadastrar</Button>
          </Link>
          <Link to="/booking">
            <Button>Agendar atendimento</Button>
          </Link>
        </div>
      </header>

      {/* Catálogo de produtos */}
      <main className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          🛍️ Nossos Produtos
        </h2>

        {loading ? (
          <p className="text-white text-center py-8">Carregando catálogo...</p>
        ) : products.length === 0 ? (
          <p className="text-white text-center py-8 opacity-80">
            Em breve produtos disponíveis.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => (
              <div
                key={p.id}
                className="bg-xp-paper shadow-xpRaised p-4 flex flex-col"
              >
                {/* Placeholder de imagem (XP-style "ícone" genérico) */}
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

                <Link to="/signup" className="mt-3">
                  <Button variant="primary" className="w-full" disabled={p.currentStock === 0}>
                    {p.currentStock === 0 ? 'Esgotado' : 'Comprar'}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="text-center text-white/60 py-6 text-[11px]">
        v0.3 · Multi-tenant SaaS com RBAC e Postgres RLS · Built with XP nostalgia
      </footer>
    </div>
  );
}
