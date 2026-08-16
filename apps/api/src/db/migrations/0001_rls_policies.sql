-- ──────────────────────────────────────────────────────────────
--  Postgres Row-Level Security (RLS) — BunkerBarbershop v0.2
-- ──────────────────────────────────────────────────────────────
--
-- Habilita RLS em todas as tabelas de domínio e cria uma policy
-- permissiva `tenant_isolation` que filtra por `current_setting('app.tenant_id')`.
--
-- A API chama `SET LOCAL app.tenant_id = $1` no início de cada
-- transação (ver src/lib/with-tenant.ts). Se a session var não
-- estiver setada, a policy retorna NULL = nenhum resultado = seguro.
--
-- Ordem de aplicação:
--   1. ENABLE RLS na tabela
--   2. FORCE RLS (até table owner respeita a policy — opcional)
--   3. CREATE POLICY permissiva
--
-- Bypass pra service role / migrations:
--   psql -U bunker ... --single-transaction  → role "bunker" é table owner
--   → FORCE RLS garante que até owner respeita policies. Pra bypassar em
--     migrations/seed, usar role separada (postgres) que tem BYPASSRLS.
-- ──────────────────────────────────────────────────────────────

-- Habilita RLS em cada tabela de domínio
ALTER TABLE "users"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_roles"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "barbers"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "services"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "appointments"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "schedule_blocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_log"       ENABLE ROW LEVEL SECURITY;

-- Policy única de isolamento por tenant (aplica em todas as tabelas)
-- PERMISSIVE = OR entre múltiplas policies da mesma operação

CREATE POLICY tenant_isolation ON "users"
  AS PERMISSIVE FOR ALL TO public
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "user_roles"
  AS PERMISSIVE FOR ALL TO public
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "barbers"
  AS PERMISSIVE FOR ALL TO public
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "services"
  AS PERMISSIVE FOR ALL TO public
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "appointments"
  AS PERMISSIVE FOR ALL TO public
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "schedule_blocks"
  AS PERMISSIVE FOR ALL TO public
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "audit_log"
  AS PERMISSIVE FOR ALL TO public
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Tabela `tenants` NÃO tem RLS — é a tabela "raiz" do multi-tenant.
-- Acesso a ela é controlado só pelo middleware de auth (commit 8).
