// Painel do Cliente — vê catálogo de produtos + seus agendamentos.
// 2 colunas: catálogo à esquerda, agendamentos à direita.
// Estilo XP fiel (paper bg, sombras elevadas, títulos em negrito).

import { useEffect, useState } from 'react';
import { Window } from '../components/ui/Window';
import { Button } from '../components/ui/Button';
import { formatBRL } from '../lib/format';
import { useAuth } from '../auth/AuthProvider';

const API = '/api';

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  retailPriceCents: number;
  currentStock: number;
}
interface Appointment { id: string; startsAt: string; status: string; serviceId: string; barberId: string; }

export function ClientPanel() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [mine, setMine] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/products`).then(r => r.json()),
      fetch(`${API}/appointments`).then(r => r.json()),
    ]).then(([p, a]) => {
      setProducts(Array.isArray(p) ? p : []);
      setMine(Array.isArray(a) ? a : []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#008080] p-4">
      <Window title={`Olá, ${user?.name} — Sua conta`} width="min(1000px, 96vw)">
        {loading ? (
          <p className="text-[12px]">Carregando...</p>
        ) : (
          <div className="grid grid-cols-[1fr_300px] gap-4">
            {/* Coluna principal: catálogo de produtos */}
            <section>
              <h3 className="text-[13px] font-bold mb-2">
                🛍️ Produtos disponíveis ({products.length})
              </h3>
              {products.length === 0 ? (
                <p className="text-[11px] text-xp-text/60 py-4 text-center">
                  Nenhum produto disponível.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {products.map(p => (
                    <div key={p.id} className="bg-white p-2 shadow-xpRaised">
                      <div className="text-[10px] uppercase text-xp-text/60">{p.category ?? 'produto'}</div>
                      <div className="text-[12px] font-bold truncate">{p.name}</div>
                      {p.description && (
                        <div className="text-[10px] text-xp-text/70 line-clamp-2 my-1">
                          {p.description}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[13px] font-bold text-xp-green">
                          {formatBRL(p.retailPriceCents / 100)}
                        </span>
                        <span className={[
                          'text-[9px] uppercase px-1',
                          p.currentStock > 5 ? 'bg-xp-green text-white'
                           : p.currentStock > 0 ? 'bg-yellow-500 text-white'
                           : 'bg-xp-red text-white',
                        ].join(' ')}>
                          {p.currentStock > 0 ? `${p.currentStock}` : 'Esgotado'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Sidebar: agendamentos */}
            <aside>
              <h3 className="text-[13px] font-bold mb-2">
                📅 Meus agendamentos ({mine.length})
              </h3>
              {mine.length === 0 ? (
                <p className="text-[11px] text-xp-text/60 py-4 text-center">
                  Nenhum agendamento ainda.
                </p>
              ) : (
                <div className="max-h-[400px] overflow-y-auto pr-1 space-y-1">
                  {mine.map(a => (
                    <div key={a.id} className="bg-white p-2 shadow-xpRaised text-[11px]">
                      <div className="text-[10px] text-xp-text/70">
                        {new Date(a.startsAt).toLocaleString('pt-BR')}
                      </div>
                      <div className="font-bold">
                        {a.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="primary" className="mt-3 w-full">
                Agendar atendimento
              </Button>
            </aside>
          </div>
        )}
      </Window>
    </div>
  );
}
