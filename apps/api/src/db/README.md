# ──────────────────────────────────────────────────────────────
#  Como rodar migrations + seed localmente
# ──────────────────────────────────────────────────────────────
#
# 1. Subir o Postgres:
#    docker compose up -d postgres
#
# 2. Gerar migrations (cria SQL em src/db/migrations/):
#    pnpm --filter @bunker/api db:generate
#
# 3. Aplicar migrations no banco:
#    pnpm --filter @bunker/api db:migrate
#
# 4. Popular com dados de demo:
#    pnpm --filter @bunker/api db:seed
#
# (alternativa dev: db:push aplica schema direto sem migrations — só pra protótipo)
