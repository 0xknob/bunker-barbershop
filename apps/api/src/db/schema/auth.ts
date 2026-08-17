// ──────────────────────────────────────────────────────────────
//  Tabelas do Better-Auth (nomes singulares conforme esperado pelo adapter).
//  Não temos FK com nossas tabelas de domínio; o vínculo é via email.
// ──────────────────────────────────────────────────────────────

import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';

// Better-Auth table: user
export const user = pgTable('user', {
  id:            text('id').primaryKey(),
  email:         text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  name:          text('name').notNull(),
  image:         text('image'),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
  updatedAt:     timestamp('updated_at').defaultNow().notNull(),
});

// Better-Auth table: session
export const session = pgTable('session', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  token:     text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Better-Auth table: account (credenciais + OAuth providers)
export const account = pgTable('account', {
  id:                    text('id').primaryKey(),
  userId:                text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accountId:             text('account_id').notNull(),
  providerId:            text('provider_id').notNull(),
  password:              text('password'),
  accessToken:           text('access_token'),
  refreshToken:          text('refresh_token'),
  accessTokenExpiresAt:  timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope:                 text('scope'),
  idToken:               text('id_token'),
  createdAt:             timestamp('created_at').defaultNow().notNull(),
  updatedAt:             timestamp('updated_at').defaultNow().notNull(),
});

// Better-Auth table: verification (tokens de verificação de email)
export const verification = pgTable('verification', {
  id:         text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value:      text('value').notNull(),
  expiresAt:  timestamp('expires_at').notNull(),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
  updatedAt:  timestamp('updated_at').defaultNow().notNull(),
});
