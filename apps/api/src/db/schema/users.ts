// Tabela users — perfil base. Better-Auth adiciona colunas de auth (sessions, accounts, etc).
// Aqui ficam só os campos de domínio que nosso app controla.
import { pgTable, uuid, text, varchar, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const users = pgTable('users', {
  id:        uuid('id').primaryKey().defaultRandom(),
  // Better-Auth usa varchar(255) para email e referencia users.id
  email:     varchar('email', { length: 255 }).notNull().unique(),
  name:      varchar('name', { length: 120 }).notNull(),
  image:     text('image'),
  // Tenant padrão do usuário (cada user pertence a pelo menos um tenant)
  tenantId:  uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
