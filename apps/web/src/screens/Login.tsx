// Tela de Login + cadastro.
// Tab única — usuário escolhe "Entrar" ou "Criar conta".
// Após autenticar, redireciona pro painel certo baseado no role.

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Window } from '../components/ui/Window';
import { Field } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { useAuth } from '../auth/AuthProvider';

type Mode = 'signin' | 'signup';

export function Login() {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Se já tá logado, manda pro painel certo
  if (user) {
    const path = user.role === 'OWNER' ? '/owner' : user.role === 'BARBER' ? '/barber' : '/customer';
    navigate(path, { replace: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        if (!name.trim()) throw new Error('Nome obrigatório');
        await signUp(email, password, name);
      }
      // AuthProvider atualizou user → useEffect vai redirecionar
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#008080]">
      <Window title={mode === 'signin' ? 'Entrar — Barbearia Retro' : 'Criar conta — Barbearia Retro'}>
        {/* Link "Voltar pra landing" — sempre visível no topo da janela */}
        <div className="mb-2 -mt-1">
          <Link to="/" className="text-[11px] text-xp-sky underline">
            ← Voltar para a página inicial
          </Link>
        </div>
        <form onSubmit={handleSubmit} className="w-[320px]">
          {mode === 'signup' && (
            <Field
              label="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
            />
          )}
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Field
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />

          {error && (
            <div className="text-[11px] text-xp-red mb-2 p-1 bg-white border border-xp-red">
              ⚠ {error}
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <button
              type="button"
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
              className="text-[11px] text-xp-sky underline"
            >
              {mode === 'signin' ? 'Criar conta' : 'Já tenho conta'}
            </button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? '...' : mode === 'signin' ? 'Entrar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </Window>
    </div>
  );
}
