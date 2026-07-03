import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './identity.js';
import { posts } from './content.js';

// ---------- tip_settings — 1:1 with user ----------
export const tipSettings = pgTable('tip_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  minAmount: numeric('min_amount', { precision: 12, scale: 2 }),
  suggestedAmounts: integer('suggested_amounts').array(),
  allowCustom: boolean('allow_custom').notNull().default(true),
  allowMessage: boolean('allow_message').notNull().default(true),
  enabled: boolean('enabled').notNull().default(false),
});

// ---------- tips ----------
export const tips = pgTable(
  'tips',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tipperId: uuid('tipper_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    postId: uuid('post_id').references(() => posts.id, { onDelete: 'set null' }),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    message: text('message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    creatorIdx: index('tips_creator_idx').on(t.creatorId),
  }),
);

// ---------- Inferred types ----------
export type TipSetting = typeof tipSettings.$inferSelect;
export type NewTipSetting = typeof tipSettings.$inferInsert;
export type Tip = typeof tips.$inferSelect;
export type NewTip = typeof tips.$inferInsert;
