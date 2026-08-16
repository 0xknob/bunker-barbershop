// Rotas de autenticação (placeholder — preenchido no commit 7 com Better-Auth)
import type { FastifyInstance } from 'fastify';

export async function authRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true }));
}
