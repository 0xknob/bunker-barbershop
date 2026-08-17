-- ──────────────────────────────────────────────────────────────
--  Postgres Row-Level Security (RLS) — BunkerBarbershop v0.2
-- ──────────────────────────────────────────────────────────────
--
-- Habilita RLS em todas as tabelas de domínio e cria uma policy
-- permissiva `tenant_isolation` que filtra por `current_setting('app.tenant_id')`.
-- A API chama `SET LOCAL app.tenant_id = $1` no início de cada transação.
-- ──────────────────────────────────────────────────────────────

ALTER TABLE "tenants"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_roles"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "barbers"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "services"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "appointments"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "schedule_blocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_log"       ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "tenants"
  AS PERMISSIVE FOR ALL TO public
  USING (id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (id = current_setting('app.tenant_id', true)::uuid);

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

CREATE POLICY tenant_isolation ON "products"
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
