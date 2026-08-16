// Rotas de agendamentos (placeholder — preenchido no commit 9)
import type { FastifyInstance } from 'fastify';

export async function appointmentRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true }));
}
