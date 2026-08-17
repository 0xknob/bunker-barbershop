// ──────────────────────────────────────────────────────────────
//  Barbearia Retro API
//  Fastify + Zod + Drizzle. Porta padrão 3001.
// ──────────────────────────────────────────────────────────────

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { authPlugin } from './plugins/auth';
import { authRoutes } from './routes/auth';
import { appointmentRoutes } from './routes/appointments';
import { serviceRoutes } from './routes/services';
import { userRoutes } from './routes/users';
import { barberRoutes } from './routes/barbers';
import { barberDashboardRoutes } from './routes/barber-dashboard';
import { productRoutes } from './routes/products';
import { env } from './env';

const app = Fastify({
  logger: {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  },
});

// ── Plugins de segurança ─────────────────────────────────────
// helmet: set headers seguros (X-Frame-Options, CSP, etc.)
// cors: allowlist de origens (front Vite + futuro deploy Vercel)
await app.register(helmet);
await app.register(cors, {
  origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
  credentials: true,
});

// ── Plugin de auth (Better-Auth) ────────────────────────────
// Monta rotas /api/auth/* e popula request.user em todas as requests
await app.register(authPlugin);

// ── Health check ─────────────────────────────────────────────
app.get('/health', async () => ({
  status: 'ok',
  service: 'barbearia-retro-api',
  timestamp: new Date().toISOString(),
}));

// ── Rotas de domínio ─────────────────────────────────────────
await app.register(authRoutes,        { prefix: '/api/auth' });
await app.register(appointmentRoutes, { prefix: '/api/appointments' });
await app.register(serviceRoutes,     { prefix: '/api/services' });
await app.register(userRoutes,        { prefix: '/api/users' });
await app.register(barberRoutes,           { prefix: '/api/barbers' });
await app.register(barberDashboardRoutes,  { prefix: '/api/barbers' });
await app.register(productRoutes,     { prefix: '/api/products' });

// ── Start ────────────────────────────────────────────────────
try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  app.log.info(`🔒 API Barbearia Retro rodando em http://localhost:${env.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
