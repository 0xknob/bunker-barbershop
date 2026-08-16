// Configuração do Better-Auth.
// Better-Auth cuida de: signup, signin, signout, sessions, JWT.
// A gente customiza o schema da tabela `user` para incluir `tenant_id`
// e usamos `additionalFields` pra expor dados no JWT.
//
// Docs: https://www.better-auth.com/docs/installation

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db/client';
import { env } from '../env';

export const auth = betterAuth({
  // Adapter Drizzle — usa nosso pool Postgres existente.
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      // Better-Auth procura essas tabelas; ainda não as criamos via schema
      // próprio, mas ele gera via migration automática se não existirem.
      user:    'users',
      session: 'sessions',
      account: 'accounts',
      verification: 'verifications',
    },
  }),

  // Email/senha é o suficiente pro MVP. OAuth entra em v0.3.
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
  },

  // Configuração de sessão
  session: {
    expiresIn: 60 * 60 * 24 * 7,   // 7 dias
    updateAge: 60 * 60 * 24,        // renova após 1 dia
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },

  // Campos extras no JWT/session além dos default (id, email, name).
  // Esses campos ficam disponíveis em `session.user.tenantId` no front-end.
  user: {
    additionalFields: {
      tenantId: { type: 'string', required: true },
    },
  },

  // Secret é obrigatório; usamos o mesmo JWT_SECRET do .env.
  secret: env.JWT_SECRET,

  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
});

export type Auth = typeof auth;
