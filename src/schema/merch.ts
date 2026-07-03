import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  jsonb,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './identity.js';
import {
  merchProductTypeEnum,
  merchDesignFormatEnum,
  merchListingStatusEnum,
  designJobStatusEnum,
  sslStatusEnum,
} from './enums.js';

// ---------- merch_stores — one per creator ----------
export const merchStores = pgTable('merch_stores', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull().unique(),
  branding: jsonb('branding'),
  customDomain: text('custom_domain'),
  sslStatus: sslStatusEnum('ssl_status').notNull().default('pending'),
});

// ---------- product_catalog — blank product types (platform-level) ----------
export const productCatalog = pgTable('product_catalog', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: merchProductTypeEnum('type').notNull(),
  sizes: text('sizes').array(),
  colors: text('colors').array(),
  baseCost: numeric('base_cost', { precision: 12, scale: 2 }).notNull(),
});

// ---------- designs — creator artwork library ----------
export const designs = pgTable(
  'designs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fileUrl: text('file_url').notNull(),
    format: merchDesignFormatEnum('format').notNull(),
  },
  (t) => ({
    creatorIdx: index('designs_creator_idx').on(t.creatorId),
  }),
);

// ---------- mockups — AI-generated ----------
export const mockups = pgTable(
  'mockups',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    designId: uuid('design_id')
      .notNull()
      .references(() => designs.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => productCatalog.id, { onDelete: 'cascade' }),
    placement: text('placement'),
    colorway: text('colorway'),
    imageUrl: text('image_url'),
  },
  (t) => ({
    designIdx: index('mockups_design_idx').on(t.designId),
  }),
);

// ---------- merch_listings — published product ----------
export const merchListings = pgTable(
  'merch_listings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => merchStores.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => productCatalog.id, { onDelete: 'restrict' }),
    designId: uuid('design_id')
      .notNull()
      .references(() => designs.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    description: text('description'),
    profitMargin: numeric('profit_margin', { precision: 12, scale: 2 }),
    retailPrice: numeric('retail_price', { precision: 12, scale: 2 }),
    status: merchListingStatusEnum('status').notNull().default('draft'),
  },
  (t) => ({
    storeIdx: index('merch_listings_store_idx').on(t.storeId),
  }),
);

// ---------- merch_listing_tags — junction ----------
export const merchListingTags = pgTable(
  'merch_listing_tags',
  {
    listingId: uuid('listing_id')
      .notNull()
      .references(() => merchListings.id, { onDelete: 'cascade' }),
    tag: text('tag').notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.listingId, t.tag] }),
  }),
);

// ---------- designer_profiles — marketplace designer ----------
export const designerProfiles = pgTable('designer_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }), // nullable if external
  portfolio: jsonb('portfolio'),
  rates: jsonb('rates'),
  rating: numeric('rating', { precision: 3, scale: 2 }),
});

// ---------- design_jobs — hire designer (escrow) ----------
export const designJobs = pgTable(
  'design_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    designerId: uuid('designer_id')
      .notNull()
      .references(() => designerProfiles.id, { onDelete: 'restrict' }),
    brief: text('brief'),
    quote: numeric('quote', { precision: 12, scale: 2 }),
    status: designJobStatusEnum('status').notNull().default('requested'),
    revisionCount: integer('revision_count').notNull().default(0),
  },
  (t) => ({
    creatorIdx: index('design_jobs_creator_idx').on(t.creatorId),
    designerIdx: index('design_jobs_designer_idx').on(t.designerId),
  }),
);

// ---------- Inferred types ----------
export type MerchStore = typeof merchStores.$inferSelect;
export type NewMerchStore = typeof merchStores.$inferInsert;
export type ProductCatalog = typeof productCatalog.$inferSelect;
export type NewProductCatalog = typeof productCatalog.$inferInsert;
export type Design = typeof designs.$inferSelect;
export type NewDesign = typeof designs.$inferInsert;
export type Mockup = typeof mockups.$inferSelect;
export type NewMockup = typeof mockups.$inferInsert;
export type MerchListing = typeof merchListings.$inferSelect;
export type NewMerchListing = typeof merchListings.$inferInsert;
export type MerchListingTag = typeof merchListingTags.$inferSelect;
export type NewMerchListingTag = typeof merchListingTags.$inferInsert;
export type DesignerProfile = typeof designerProfiles.$inferSelect;
export type NewDesignerProfile = typeof designerProfiles.$inferInsert;
export type DesignJob = typeof designJobs.$inferSelect;
export type NewDesignJob = typeof designJobs.$inferInsert;
