# Dockerfile — API em produção (Railway, Fly, Render).
# Stage 1: deps + build
FROM node:20-slim AS builder

# Habilita pnpm via corepack
RUN corepack enable && corepack prepare pnpm@11 --activate

WORKDIR /app

# Copia manifests primeiro (cache de deps)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Instala deps do workspace
RUN pnpm install --frozen-lockfile --filter @bunker/api... --filter @bunker/shared

# Copia fontes e builda
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

WORKDIR /app/apps/api
RUN pnpm build
# packages/shared precisa existir pra runtime (Vite/tRPC resolveriam
# diferente, mas aqui preferimos build standalone)
WORKDIR /app

# Stage 2: runtime slim
FROM node:20-slim AS runner

# pnpm ainda necessário pra resolver workspaces
RUN corepack enable && corepack prepare pnpm@11 --activate

ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app

# Copia built artifacts + node_modules minimo (prod only)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules ./node_modules

WORKDIR /app/apps/api

EXPOSE 3001

# Healthcheck (DOCKER + Railway usam)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Roda direto o JS compilado
CMD ["node", "dist/server.js"]
