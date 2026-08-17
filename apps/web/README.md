# `@barbearia-retro/web`

Frontend React 19 + Vite do **Barbearia Retro**.

## Stack
- **React 19** + **Vite 8**
- **React Router 7** (`createBrowserRouter`)
- **Tailwind CSS 3** com **tokens XP** (cores próprias em `tailwind.config.js`)
- **Zustand 5** — state global quando precisa (auth via context)
- **Better-Auth React client** + **CASL** — auth + authz
- **date-fns** — datas (formato pt-BR)

## Scripts

```bash
pnpm dev          # Vite dev (HMR)
pnpm build        # tsc + vite build → dist/
pnpm preview      # serve dist/ localmente
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest run (formatters)
pnpm test:watch   # vitest --watch
```

## Env vars

```bash
cp apps/web/.env.example apps/web/.env
```

Variável principal: `VITE_API_URL` (default `http://localhost:3001`).

Vite faz **proxy** de `/api` → `http://localhost:3001` automaticamente (ver `vite.config.ts`), evitando CORS no dev.

## Estrutura

```
src/
├── auth/                       # Better-Auth client + AuthProvider
├── components/                 # UI retros (Window, TitleBar, Button, Field)
│   ├── ui/                     #   primitivos XP (papel, bordas, sombras)
│   ├── AppSplash.tsx           #   splash BIOS no 1o acesso
│   ├── CommissionEditor.tsx    #   modal edicao comissao
│   └── screens/                # BIOSBootScreen, Desktop
├── screens/                    # paginas por role
│   ├── LandingWithSplash.tsx   # publica (com BIOS)
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── Booking.tsx             # requer login
│   ├── BookingPublic.tsx       # sem login (visitante)
│   ├── ClientPanel.tsx         # CUSTOMER
│   ├── BarberPanel.tsx         # BARBER
│   ├── OwnerPanel.tsx          # OWNER (multi-aba)
│   └── Unauthorized.tsx
├── store/                      # Zustand stores (legado; auth usa context)
├── data/                       # mocks estáticos (legado; substituído por API)
├── lib/                        # formatadores (R$, min), cn(), formatters.test.ts
├── routes.tsx                  # BrowserRouter config
├── main.tsx                    # entrypoint (StrictMode + Providers)
└── App.tsx                     # (legado; substituído por routes.tsx)
```

## UI / Identidade visual

### Tokens XP (`tailwind.config.js`)
- `xp.sky` `#245edb` — título clássico
- `xp.skyDark` `#0831d9` — gradiente inferior
- `xp.paper` `#ece9d8` — fundo de janela
- `xp.paperDark` `#d6d2c2` — header de tabela
- `bios.fg` `#aaa`, `bios.bg` `#000` — tela de boot

### Sombras
- `shadow-xpRaised` — borda branca EM CIMA/ESQUERDA, cinza EMBAIXO/DIREITA (botão elevado)
- `shadow-xpPressed` — inverso (botão pressionado)
- `shadow-xp-card` — sombra única simples (pra caixas)

⚠️ **Tailwind v3 aceita múltiplas shadows como string OU array**, não como string única com vírgulas internas. Ver `tailwind.config.js`.

### Fontes
- Hero/title: `'Trebuchet MS'` (system fallback)
- Texto corrido: `'Trebuchet MS', Tahoma, Verdana, sans-serif`
- BIOS/datas: `'Lucida Console', 'Courier New', monospace`

## Padrão de multi-aba com state preservado

`OwnerPanel` e `BarberPanel` usam o mesmo padrão:

```ts
const [win, setWin] = useState({ open: false, data: ... });
// open/close individual; render condicional; state preservado entre aberturas
```

Tipos `WindowState<T>` ajudam generalizar. Quando você troca entre abas (Agenda/Controles/Equipe/...), o state interno (scroll, filtros, edição inline) **não é perdido** porque as janelas não desmontam — só saem de cena.

## Deploy (Vercel)

```bash
vercel --prod
```

Ou importar este repo no painel. `vercel.json` na raiz configura:
- Build: `pnpm --filter @barbearia-retro/web build`
- Output: `apps/web/dist`
- Rewrites: `/api/*` → `https://api.barbearia-retro.app/api/*` (configurar via env)

Variáveis de ambiente:
- `VITE_API_URL` = URL do backend em prod

## Testes

```
pnpm test
```

7 testes: formatadores `formatBRL` (R$, pt-BR) e `formatDuration` (min/h).
