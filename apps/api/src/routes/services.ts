// Rotas de serviços (placeholder — preenchido no commit 10)
import type { FastifyInstance } from 'fastify';

export async function serviceRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true }));
}
