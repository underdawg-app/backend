import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './identity.js';
import {
  campaignTierEnum,
  gigApplicationStatusEnum,
  negotiationStatusEnum,
  deliverableReviewStatusEnum,
} from './enums.js';

// ---------- brands — STANDALONE (unrelated to creators) ----------
export const brands = pgTable('brands', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  logoUrl: text('logo_url'),
  description: text('description'),
  industry: text('industry'),
  website: text('website'),
  verified: boolean('verified').notNull().default(false),
});

// ---------- gigs ----------
export const gigs = pgTable(
  'gigs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    brief: text('brief'),
    deliverables: text('deliverables').array(),
    guidelines: text('guidelines'),
    budgetMin: numeric('budget_min', { precision: 12, scale: 2 }),
    budgetMax: numeric('budget_max', { precision: 12, scale: 2 }),
    timeline: text('timeline'),
    requirements: text('requirements').array(),
    exclusivity: text('exclusivity'),
    usageRights: text('usage_rights'),
    isGetViral: boolean('is_get_viral').notNull().default(false),
    campaignTier: campaignTierEnum('campaign_tier'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    brandIdx: index('gigs_brand_idx').on(t.brandId),
  }),
);

// ---------- gig_applications ----------
export const gigApplications = pgTable(
  'gig_applications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    gigId: uuid('gig_id')
      .notNull()
      .references(() => gigs.id, { onDelete: 'cascade' }),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    pitch: text('pitch'),
    rate: numeric('rate', { precision: 12, scale: 2 }),
    timeline: text('timeline'),
    contentIdeas: text('content_ideas'),
    status: gigApplicationStatusEnum('status').notNull().default('pending'),
  },
  (t) => ({
    gigIdx: index('gig_applications_gig_idx').on(t.gigId),
    creatorIdx: index('gig_applications_creator_idx').on(t.creatorId),
  }),
);

// ---------- negotiations (chat lives in Firebase) ----------
export const negotiations = pgTable('negotiations', {
  id: uuid('id').defaultRandom().primaryKey(),
  gigApplicationId: uuid('gig_application_id')
    .notNull()
    .references(() => gigApplications.id, { onDelete: 'cascade' }),
  firebaseThreadId: text('firebase_thread_id'),
  termsSummary: jsonb('terms_summary'),
  status: negotiationStatusEnum('status').notNull().default('open'),
});

// ---------- contracts ----------
export const contracts = pgTable(
  'contracts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    gigId: uuid('gig_id')
      .notNull()
      .references(() => gigs.id, { onDelete: 'cascade' }),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id, { onDelete: 'cascade' }),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    terms: jsonb('terms'),
    pdfUrl: text('pdf_url'),
    creatorSignedAt: timestamp('creator_signed_at', { withTimezone: true }),
    brandSignedAt: timestamp('brand_signed_at', { withTimezone: true }),
  },
  (t) => ({
    gigIdx: index('contracts_gig_idx').on(t.gigId),
  }),
);

// ---------- deliverables ----------
export const deliverables = pgTable(
  'deliverables',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    gigId: uuid('gig_id')
      .notNull()
      .references(() => gigs.id, { onDelete: 'cascade' }),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fileUrls: text('file_urls').array(),
    caption: text('caption'),
    liveLink: text('live_link'),
    reviewStatus: deliverableReviewStatusEnum('review_status').notNull().default('pending'),
    revisionCount: integer('revision_count').notNull().default(0),
    submissionNotes: text('submission_notes'),
  },
  (t) => ({
    gigIdx: index('deliverables_gig_idx').on(t.gigId),
  }),
);

// ---------- market_rates — reference data ----------
export const marketRates = pgTable('market_rates', {
  id: uuid('id').defaultRandom().primaryKey(),
  niche: text('niche'),
  platform: text('platform'),
  followerBand: text('follower_band'),
  rateLow: numeric('rate_low', { precision: 12, scale: 2 }),
  rateHigh: numeric('rate_high', { precision: 12, scale: 2 }),
});

// ---------- gig_reviews — brand <-> creator ratings ----------
export const gigReviews = pgTable(
  'gig_reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    gigId: uuid('gig_id')
      .notNull()
      .references(() => gigs.id, { onDelete: 'cascade' }),
    raterId: uuid('rater_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rateeId: uuid('ratee_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    stars: integer('stars').notNull(),
    text: text('text'),
  },
  (t) => ({
    gigIdx: index('gig_reviews_gig_idx').on(t.gigId),
  }),
);

// ---------- Inferred types ----------
export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;
export type Gig = typeof gigs.$inferSelect;
export type NewGig = typeof gigs.$inferInsert;
export type GigApplication = typeof gigApplications.$inferSelect;
export type NewGigApplication = typeof gigApplications.$inferInsert;
export type Negotiation = typeof negotiations.$inferSelect;
export type NewNegotiation = typeof negotiations.$inferInsert;
export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;
export type Deliverable = typeof deliverables.$inferSelect;
export type NewDeliverable = typeof deliverables.$inferInsert;
export type MarketRate = typeof marketRates.$inferSelect;
export type NewMarketRate = typeof marketRates.$inferInsert;
export type GigReview = typeof gigReviews.$inferSelect;
export type NewGigReview = typeof gigReviews.$inferInsert;
