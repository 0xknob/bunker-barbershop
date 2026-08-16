// Rotas de usuários (placeholder — preenchido no commit 10)
import type { FastifyInstance } from 'fastify';

export async function userRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true }));
}
