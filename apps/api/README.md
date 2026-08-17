# `@barbearia-retro/api`

Backend Fastify 5 + TypeScript do **Barbearia Retro**.

## Stack
- **Fastify 5** — HTTP server
- **Zod v4** — validação de body (schema → runtime)
- **Drizzle ORM** + **node-postgres** — query layer
- **Better-Auth** — sessões e sign-in
- **@fastify/helmet** + **@fastify/cors** — segurança HTTP
- **CASL** — regras de autorização

## Scripts

```bash
pnpm dev          # tsx watch (auto-restart)
pnpm build        # tsc → dist/
pnpm start        # roda dist/server.js
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest run
pnpm test:watch   # vitest
pnpm db:generate  # drizzle-kit generate (cria SQL)
pnpm db:migrate   # aplica migration no DB
pnpm db:seed      # popula DB com dados demo
pnpm db:studio    # Drizzle Studio (GUI)
```

## Env vars

Veja `apps/api/.env.example`. Copie pra `apps/api/.env` e ajuste:

```bash
cp apps/api/.env.example apps/api/.env
```

Gerar `JWT_SECRET`:
```bash
openssl rand -base64 32
```

## Estrutura

```
src/
├── server.ts                # entrypoint Fastify
├── env.ts                   # Zod parse + tipos das env vars
├── plugins/
│   └── auth.ts              # Better-Auth handler + onRequest hook
├── routes/
│   ├── auth.ts              # /whoami
│   ├── appointments.ts      # CRUD appointments + cancel + audit
│   ├── barbers.ts           # CRUD profile (PATCH commission = OWNER)
│   ├── barber-dashboard.ts  # /me/dashboard (stats + agenda + top services)
│   ├── products.ts          # /api/products (público + OWNER write)
│   ├── services.ts          # /api/services
│   └── users.ts             # /api/users (me, barbers, staff)
├── schemas/                  # Zod (request/response)
├── services/                 # regras de negócio puras (testáveis)
│   ├── appointment-rules.ts
│   ├── appointment-rules.test.ts
│   ├── barber-stats.ts
│   └── barber-stats.test.ts
├── middleware/
│   └── auth.ts              # requireAuth, requireRole, attachAbility
├── lib/
│   ├── ability.ts           # defineAbilityFor
│   ├── cn.ts                # cn() — clsx + tw
│   ├── db.ts                # pg Pool + drizzle client
│   └── with-tenant.ts       # BEGIN; SET LOCAL app.tenant_id; callback
└── db/
    ├── schema/              # tabelas (ver padrão em schema/<nome>.ts)
    ├── migrations/          # SQL versionado (drizzle-kit output)
    ├── client.ts            # drizzle client singleton
    ├── apply-rls.mjs        # script manual pra reaplicar RLS
    ├── seed.ts              # dados demo
    └── README.md            # instruções DB
```

## Defesas em profundidade (RBAC)

Cada request passa por 3 camadas:

1. **Middleware Fastify**: `requireAuth` (sessão) → `requireRole` (papel)
2. **CASL**: `defineAbilityFor(role, userId, tenantId)` modela ownership
3. **Postgres RLS**: `tenant_isolation` policy filtra por `app.tenant_id`

Se uma camada falhar (developer esquece `WHERE tenant_id = ...`), as outras seguram.

## Endpoints principais

| Método | Rota | Role | Função |
|---|---|---|---|
| GET | `/api/auth/sign-in/email` | público | Login (Better-Auth) |
| GET | `/api/auth/whoami` | auth | user.role + tenantId |
| GET | `/api/products` | público | Catálogo (só is_active + sell_online) |
| GET | `/api/products?all=true` | OWNER | lista tudo |
| GET | `/api/services` | auth | Serviços (pra agendar) |
| GET | `/api/users/barbers` | auth | Lista barbeiros |
| GET | `/api/users/staff` | OWNER | Lista equipe |
| GET | `/api/appointments` | auth | Filtra por role (CUSTOMER ve só seus) |
| POST | `/api/appointments` | público | Cria (aceita guest) |
| POST | `/api/appointments/:id/cancel` | auth | late_cancel se < 24h |
| GET | `/api/barbers/me/dashboard` | BARBER | Stats pro BarberPanel |
| PATCH | `/api/barbers/:id` | OWNER | Atualiza comissão (audit log) |
| GET | `/api/services` | (open) | Catálogo público |

Ver `docs/` (em breve) pra coleção Postman/OpenAPI.

## DB local

```bash
# Postgres (Docker compose na raiz)
docker compose up -d postgres

# Migrar + popular
pnpm db:migrate
pnpm db:seed

# Resetar tudo
docker compose down -v && docker compose up -d postgres
pnpm db:migrate && pnpm db:seed

# RLS precisa ser aplicado manualmente após migrate
node src/db/apply-rls.mjs
```

## Deploy

- **Railway**: `railway.toml` na raiz. Aponta pro `apps/api/Dockerfile`.
  - Postgres via Railway plugin → `DATABASE_URL` auto
  - Variáveis manuais: `JWT_SECRET` (openssl rand -base64 32)
  - Release command: `pnpm --filter @barbearia-retro/api db:migrate`
- **Fly.io** / **Render** / **AWS**: mesmo Dockerfile funciona.
- **Hetzner / VPS**: `node dist/server.js` direto.

## Testes

```
pnpm test
```

26 testes atualmente:
- `services/appointment-rules.test.ts` (7) — janela de cancelamento, cálculo de fim
- `services/barber-stats.test.ts` (15) — receita, comissão, ticket médio, top services
