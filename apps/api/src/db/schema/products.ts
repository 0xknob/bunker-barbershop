// Catálogo de produtos à venda (pomadas, shampoos, óleos...).
// Modelo baseado em Boulevard/Fresha/Mangomint (research v0.3).
//
// - retail_price_cents em centavos (evita float em moeda)
// - cost_price_cents: pra cálculo de margem no futuro (v0.4+)
// - current_stock: estoque atual (decrementado manualmente no MVP)
// - low_stock_threshold: alerta quando estoque < esse número
// - sell_online: aparece na página pública e no painel do CUSTOMER
// - is_active: hide sem deletar (soft-delete via deletedAt)
// - UNIQUE (tenant_id, sku) garante que não duplica SKU dentro do tenant
//
// Multi-tenant: 100% tenant-isolado. RLS já está aplicado via 0001.

import { pgTable, text, uuid, varchar, text as textCol, integer, timestamp, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const products = pgTable(
  'products',
  {
    id:                 text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    tenantId:           uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    sku:                varchar('sku', { length: 60 }),
    name:               varchar('name', { length: 120 }).notNull(),
    description:        textCol('description'),
    category:           varchar('category', { length: 60 }),
    imageUrl:           text('image_url'),
    retailPriceCents:   integer('retail_price_cents').notNull(),
    costPriceCents:     integer('cost_price_cents').notNull().default(0),
    currentStock:       integer('current_stock').notNull().default(0),
    lowStockThreshold:  integer('low_stock_threshold').notNull().default(5),
    isActive:           boolean('is_active').notNull().default(true),
    sellOnline:         boolean('sell_online').notNull().default(true),
    createdAt:          timestamp('created_at').defaultNow().notNull(),
    updatedAt:          timestamp('updated_at').defaultNow().notNull(),
    deletedAt:          timestamp('deleted_at'),
  },
  (t) => [
    uniqueIndex('products_tenant_sku_unique').on(t.tenantId, t.sku),
  ],
);
