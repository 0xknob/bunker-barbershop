// Tela de cadastro — coleta email, senha, nome e telefone.
// Após signup, redireciona pro painel de CUSTOMER (default).

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Window } from '../components/ui/Window';
import { Field } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { useAuth } from '../auth/AuthProvider';

export function Signup() {
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  if (user) navigate('/', { replace: true });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!name.trim()) throw new Error('Nome obrigatório');
      await signUp(email, password, name);
      // signUp chama signIn dentro → AuthProvider popula user
      // Após signup o user entra como CUSTOMER no tenant seed
      navigate('/customer', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#008080] p-4 overflow-auto">
      <Window title="Criar conta — Barbearia Retro" width="min(380px, 92vw)">
        <div className="mb-2 -mt-1 flex justify-between items-center">
          <Link to="/" className="text-[11px] text-xp-sky underline">
            ← Voltar para a página inicial
          </Link>
          <Link to="/login" className="text-[11px] text-xp-sky underline">
            Já tenho conta
          </Link>
        </div>
        <form onSubmit={handleSubmit}>
          <Field label="Nome completo" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} autoFocus />
          <Field
            label="Telefone (WhatsApp)"
            type="tel"
            placeholder="(11) 98765-4321"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={20}
          />
          <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Field label="Senha (mín. 8 caracteres)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />

          {error && (
            <div className="text-[11px] text-xp-red mb-2 p-1 bg-white border border-xp-red">
              ⚠ {error}
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-[11px] text-xp-sky underline"
            >
              Já tenho conta
            </button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar conta'}
            </Button>
          </div>
        </form>
      </Window>
    </div>
  );
}
