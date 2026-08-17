// Configuração do Better-Auth.
//
// Schema do BA mora em src/db/schema/auth.ts (user, session, account, verification).
// Resto do nosso domínio mora em outras tabelas (users, user_roles, etc).
// O vínculo entre BA.user.id e nosso users.id é por email — feito no seed
// e em /api/auth/whoami.
//
// Docs: https://www.better-auth.com/docs/installation

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db/client';
import * as schema from '../db/schema';
import { env } from '../env';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user:         schema.user,
      session:      schema.session,
      account:      schema.account,
      verification: schema.verification,
    },
  }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },

  secret: env.JWT_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
});

export type Auth = typeof auth;
