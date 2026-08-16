# 🪒 BunkerBarbershop — SaaS de agendamento com UI retrô Windows XP / BIOS

> Barbearia com cara dos anos 2000, RBAC multi-role, defesa em profundidade via Postgres RLS.

![Status](https://img.shields.io/badge/status-MVP%20v0.2-blue)
![Stack](https://img.shields.io/badge/stack-React%2019%20%2B%20TS%20%2B%20Fastify%20%2B%20Drizzle-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Proposta

Pequenas barbearias ainda usam caderno, WhatsApp solto ou sistemas genéricos. A **BunkerBarbershop** entrega:

- 🎨 **Identidade visual retrô marcante** (boot estilo BIOS, janelas e botões Windows XP)
- 🔐 **3 papéis distintos**: `CUSTOMER`, `BARBER`, `OWNER` — cada um vê só o que deve
- 🛡️ **Defesa em profundidade**: middleware → CASL → Postgres RLS
- 📦 **Multi-tenant desde o dia 1** (cada barbearia é um tenant isolado)
- 📝 **Audit log** em ações sensíveis (LGPD/GDPR ready)

---

## 🏗 Arquitetura (v0.2)

```
bunker-barbershop/                    ← pnpm + Turborepo monorepo
├── apps/
│   ├── web/                          ← React 19 + Vite (Vercel)
│   └── api/                          ← Fastify 5 + TS (Railway)
├── packages/
│   └── shared/                       ← tipos + CASL ability + Zod
├── docker-compose.yml                ← Postgres 17 local
└── .github/workflows/ci.yml          ← CI
```

**Stack:**

| Camada | Escolha |
|---|---|
| Front | React 19 + Vite + Tailwind + React Router 7 + `@casl/react` |
| Auth | **Better-Auth** (TS-first, zero lock-in) |
| Backend | **Fastify 5** + Zod + helmet + cors |
| ORM | **Drizzle** + node-postgres |
| DB | Postgres 17 (Docker local → Neon em prod) |
| Authz | **CASL** (`@casl/ability` no back, `@casl/react` no front — mesma ability) |
| RLS | Postgres nativo + `current_setting('app.tenant_id')` |
| Monorepo | pnpm workspaces + Turborepo |

---

## 🚀 Rodar local

Pré-requisitos: **Node 20+**, **pnpm 11+**, **Docker**.

```bash
# 1. Instalar deps
pnpm install

# 2. Subir Postgres
docker compose up -d postgres

# 3. Configurar .env (copie o exemplo)
cp apps/api/.env.example apps/api/.env
# Edite JWT_SECRET com algo aleatório de 32+ chars

# 4. Gerar + aplicar migrations + seed
pnpm db:migrate
pnpm db:seed

# 5. Subir front + back em paralelo
pnpm dev
```

Abre:
- **Front:** http://localhost:5173
- **API:** http://localhost:3001/health
- **Drizzle Studio:** `pnpm --filter @bunker/api db:studio`

**Logins de demo** (após seed):

| Role | Email |
|---|---|
| OWNER | `rui@bunker.dev` |
| BARBER | `carlos@bunker.dev` / `tiago@bunker.dev` |
| CUSTOMER | `cliente@example.com` |

> Senha: definir no signup. Após primeiro login, o seed não cria senhas (Better-Auth usa hash separado).

---

## � Estrutura

```
apps/web/src/
├── auth/              # AuthProvider (Better-Auth client + CASL ability)
├── components/
│   ├── guards/        # RequireRole (rota), RoleGate (inline), AbilityProvider + <Can>
│   ├── screens/       # BIOSBoot, Desktop, Welcome, BookingFlow, AdminPanel
│   └── ui/            # Window, TitleBar, Button, Field, OptionCard, TaskbarButton
├── screens/           # Login, ClientPanel, BarberPanel, OwnerPanel
├── routes.tsx         # React Router 7 config
└── main.tsx

apps/api/src/
├── plugins/auth.ts    # Better-Auth handler + hook onRequest
├── routes/            # auth, appointments, services, users
├── middleware/        # requireAuth, requireRole, attachAbility
├── services/          # appointment-rules (late_cancel 24h)
├── schemas/           # Zod (create/cancel appointment)
├── db/                # schema/ + migrations/ + seed.ts + client.ts
└── lib/               # auth, ability, db (pool), with-tenant (RLS context)
```

---

## 🔐 Camadas de segurança (defense in depth)

```
┌─────────────────────────────────────────────────┐
│ 1. UI (RoleGate, RequireRole, <Can>)             │ ← UX (não é segurança)
├─────────────────────────────────────────────────┤
│ 2. Middleware Fastify (requireAuth/requireRole)  │ ← barreira declarativa
├─────────────────────────────────────────────────┤
│ 3. CASL ability (defineAbilityFor(role))         │ ← regras com ownership
├─────────────────────────────────────────────────┤
│ 4. Postgres RLS (current_setting('app.tenant_id'))│ ← barreira final
└─────────────────────────────────────────────────┘
```

**Por que 4 camadas?** Se um developer esquecer o `WHERE tenant_id = ...` ou um atacante manipular o JWT, o RLS ainda recusa. Documentado em [DECISIONS.md](DECISIONS.md).

---

## 🧪 Scripts

```bash
# raiz do monorepo
pnpm dev          # sobe front + back em paralelo
pnpm build        # build de produção de todos os packages
pnpm typecheck    # tsc em todos os packages
pnpm lint         # oxlint no front

# apenas backend
pnpm db:up        # docker compose up -d postgres
pnpm db:migrate   # aplica migrations
pnpm db:seed      # popula dados de demo
pnpm db:studio    # Drizzle Studio (GUI do DB)
```

---

## 🗺 Roadmap

| Versão | Status | Entrega |
|---|---|---|
| **v0.1** | ✅ | Boot BIOS + Desktop XP + booking wizard + admin panel (localStorage) |
| **v0.2** | ✅ atual | RBAC (3 roles) + Postgres + Fastify + Better-Auth + RLS + 3 painéis |
| v0.3 | 📋 | Notificações (WhatsApp via Cliqbot) + wizard completo de booking |
| v0.4 | 📋 | Multi-tenant real (signup cria tenant) |
| v0.5 | 📋 | PWA (instalar no celular) |
| v1.0 | 📋 | Relatórios + exportação CSV + Stripe |

---

## 📝 Licença

MIT — use, modifique, distribua.
