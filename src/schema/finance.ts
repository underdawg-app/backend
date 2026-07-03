import {
  pgTable,
  uuid,
  text,
  boolean,
  numeric,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './identity.js';
import { gigs } from './gigs.js';
import {
  transactionTypeEnum,
  transactionSourceEnum,
  payoutStatusEnum,
  paymentMethodTypeEnum,
  kycStatusEnum,
  feeStreamEnum,
} from './enums.js';

// ---------- wallets — 1:1 with user ----------
export const wallets = pgTable('wallets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  availableBalance: numeric('available_balance', { precision: 14, scale: 2 }).notNull().default('0'),
  pendingBalance: numeric('pending_balance', { precision: 14, scale: 2 }).notNull().default('0'),
  currency: text('currency').notNull().default('INR'),
});

// ---------- payment_methods ----------
export const paymentMethods = pgTable(
  'payment_methods',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: paymentMethodTypeEnum('type').notNull(),
    details: text('details'), // encrypted at app layer
    isDefault: boolean('is_default').notNull().default(false),
    verified: boolean('verified').notNull().default(false),
  },
  (t) => ({
    userIdx: index('payment_methods_user_idx').on(t.userId),
  }),
);

// ---------- transactions — ledger ----------
export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: transactionTypeEnum('type').notNull(),
    source: transactionSourceEnum('source'),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    refId: uuid('ref_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('transactions_user_idx').on(t.userId, t.createdAt),
  }),
);

// ---------- payouts ----------
export const payouts = pgTable(
  'payouts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id, {
      onDelete: 'set null',
    }),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    status: payoutStatusEnum('status').notNull().default('processing'),
    eta: timestamp('eta', { withTimezone: true }),
  },
  (t) => ({
    userIdx: index('payouts_user_idx').on(t.userId),
  }),
);

// ---------- invoices ----------
export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    gigId: uuid('gig_id').references(() => gigs.id, { onDelete: 'set null' }),
    items: jsonb('items'),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    pdfUrl: text('pdf_url'),
  },
  (t) => ({
    userIdx: index('invoices_user_idx').on(t.userId),
  }),
);

// ---------- tax_profiles — 1:1 with user ----------
export const taxProfiles = pgTable('tax_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  pan: text('pan'),
  gst: text('gst'),
  kycStatus: kycStatusEnum('kyc_status').notNull().default('pending'),
});

// ---------- fee_configs — reference ----------
export const feeConfigs = pgTable('fee_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  stream: feeStreamEnum('stream').notNull(),
  platformPct: numeric('platform_pct', { precision: 5, scale: 2 }),
  managementPct: numeric('management_pct', { precision: 5, scale: 2 }),
});

// ---------- Inferred types ----------
export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Payout = typeof payouts.$inferSelect;
export type NewPayout = typeof payouts.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type TaxProfile = typeof taxProfiles.$inferSelect;
export type NewTaxProfile = typeof taxProfiles.$inferInsert;
export type FeeConfig = typeof feeConfigs.$inferSelect;
export type NewFeeConfig = typeof feeConfigs.$inferInsert;
