import { pgTable, uuid, text, integer, boolean, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './identity.js';
import { portfolioPieceTypeEnum, pageVisibilityEnum, openToTypeEnum } from './enums.js';

// ---------- portfolios — 1:1 with creator ----------
export const portfolios = pgTable(
  'portfolios',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    viewCount: integer('view_count').notNull().default(0),
    linkClickCount: integer('link_click_count').notNull().default(0),
  },
);

// ---------- portfolio_pieces ----------
export const portfolioPieces = pgTable(
  'portfolio_pieces',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    portfolioId: uuid('portfolio_id')
      .notNull()
      .references(() => portfolios.id, { onDelete: 'cascade' }),
    title: text('title'),
    note: text('note'),
    type: portfolioPieceTypeEnum('type').notNull(),
    fileUrl: text('file_url'),
    embedUrl: text('embed_url'),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    portfolioIdx: index('portfolio_pieces_portfolio_idx').on(t.portfolioId),
  }),
);

// ---------- public_page_configs ----------
export const publicPageConfigs = pgTable('public_page_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  visibility: pageVisibilityEnum('visibility').notNull().default('public'),
  hideStats: boolean('hide_stats').notNull().default(false),
  hideRates: boolean('hide_rates').notNull().default(false),
});

// ---------- open_to — collab/brand-deals/commissions toggles ----------
export const openTo = pgTable(
  'open_to',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: openToTypeEnum('type').notNull(),
    enabled: boolean('enabled').notNull().default(true),
  },
  (t) => ({
    userIdx: index('open_to_user_idx').on(t.userId),
  }),
);

// ---------- rates — "what I make" ----------
export const rates = pgTable(
  'rates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    service: text('service').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('INR'),
    isPublic: boolean('is_public').notNull().default(true),
  },
  (t) => ({
    userIdx: index('rates_user_idx').on(t.userId),
  }),
);

// ---------- past_clients ----------
export const pastClients = pgTable(
  'past_clients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    logoUrl: text('logo_url'),
  },
  (t) => ({
    userIdx: index('past_clients_user_idx').on(t.userId),
  }),
);

// ---------- Inferred types ----------
export type Portfolio = typeof portfolios.$inferSelect;
export type NewPortfolio = typeof portfolios.$inferInsert;
export type PortfolioPiece = typeof portfolioPieces.$inferSelect;
export type NewPortfolioPiece = typeof portfolioPieces.$inferInsert;
export type PublicPageConfig = typeof publicPageConfigs.$inferSelect;
export type NewPublicPageConfig = typeof publicPageConfigs.$inferInsert;
export type OpenTo = typeof openTo.$inferSelect;
export type NewOpenTo = typeof openTo.$inferInsert;
export type Rate = typeof rates.$inferSelect;
export type NewRate = typeof rates.$inferInsert;
export type PastClient = typeof pastClients.$inferSelect;
export type NewPastClient = typeof pastClients.$inferInsert;
