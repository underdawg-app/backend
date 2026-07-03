import { pgTable, uuid, text, numeric, date, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './identity.js';
import { subscriptionAudienceEnum, subscriptionStatusEnum } from './enums.js';

// ---------- subscription_plans — catalog ----------
export const subscriptionPlans = pgTable('subscription_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  audience: subscriptionAudienceEnum('audience').notNull(),
  name: text('name').notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull().default('0'),
  perks: jsonb('perks'),
});

// ---------- subscriptions ----------
// billing_history is derived from transactions — no column.
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id')
      .notNull()
      .references(() => subscriptionPlans.id, { onDelete: 'restrict' }),
    status: subscriptionStatusEnum('status').notNull().default('active'),
    renewalDate: date('renewal_date'),
  },
  (t) => ({
    userIdx: index('subscriptions_user_idx').on(t.userId),
  }),
);

// ---------- Inferred types ----------
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
