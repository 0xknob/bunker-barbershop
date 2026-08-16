// Plugin Fastify que monta o handler do Better-Auth em /api/auth/*
// e adiciona um decorador `request.user` com o usuário autenticado.
//
// Rotas montadas:
//   POST /api/auth/sign-up/email
//   POST /api/auth/sign-in/email
//   POST /api/auth/sign-out
//   GET  /api/auth/session
//   ... e todas as outras que Better-Auth expõe.

import type { FastifyInstance, FastifyRequest } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { auth } from '../lib/auth';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      name: string;
      tenantId: string;
    };
  }
}

export const authPlugin = fastifyPlugin(async (app: FastifyInstance) => {
  // Monta todas as rotas do Better-Auth no prefixo /api/auth
  app.all('/api/auth/*', async (req, reply) => {
    const request = new Request(
      `${req.protocol}://${req.hostname}${req.url}`,
      {
        method: req.method,
        headers: req.headers as HeadersInit,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
      },
    );
    const response = await auth.handler(request);
    reply.code(response.status);
    response.headers.forEach((value, key) => reply.header(key, value));
    return reply.send(await response.text());
  });

  // Hook global que popula request.user se houver sessão válida.
  // Roda em onRequest (antes do handler). Falha silenciosa se não autenticado —
  // quem decide se precisa de auth é o preHandler de cada rota.
  app.addHook('onRequest', async (req: FastifyRequest) => {
    const headers = new Headers();
    Object.entries(req.headers).forEach(([k, v]) => {
      if (typeof v === 'string') headers.set(k, v);
    });

    const session = await auth.api.getSession({ headers });
    if (session?.user) {
      req.user = {
        id:       session.user.id,
        email:    session.user.email,
        name:     session.user.name,
        tenantId: (session.user as { tenantId?: string }).tenantId ?? '',
      };
    }
  });
});
