import { pgTable, uuid, text, integer, timestamp, date, jsonb, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './identity.js';
import {
  reputationTierEnum,
  identityVerificationStatusEnum,
  verificationApplicationStatusEnum,
} from './enums.js';

// ---------- reputation_scores — 1:1 with user ----------
export const reputationScores = pgTable('reputation_scores', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  score: integer('score').notNull().default(0),
  tier: reputationTierEnum('tier').notNull().default('emerging'),
  factors: jsonb('factors'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- reputation_history — daily score snapshots ----------
export const reputationHistory = pgTable('reputation_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  score: integer('score').notNull(),
  capturedOn: date('captured_on').notNull(),
});

// ---------- badges — catalog ----------
export const badges = pgTable('badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  criteria: text('criteria'),
});

// ---------- user_badges — junction (earned) ----------
export const userBadges = pgTable(
  'user_badges',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    badgeId: uuid('badge_id')
      .notNull()
      .references(() => badges.id, { onDelete: 'cascade' }),
    earnedAt: timestamp('earned_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.badgeId] }),
  }),
);

// ---------- identity_verifications — KYC ----------
export const identityVerifications = pgTable('identity_verifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  idDocUrl: text('id_doc_url'),
  selfieUrl: text('selfie_url'),
  status: identityVerificationStatusEnum('status').notNull().default('pending'),
  reason: text('reason'),
});

// ---------- verification_applications — blue check ----------
export const verificationApplications = pgTable('verification_applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: verificationApplicationStatusEnum('status').notNull().default('pending'),
  criteriaMet: jsonb('criteria_met'),
});

// ---------- Inferred types ----------
export type ReputationScore = typeof reputationScores.$inferSelect;
export type NewReputationScore = typeof reputationScores.$inferInsert;
export type ReputationHistory = typeof reputationHistory.$inferSelect;
export type NewReputationHistory = typeof reputationHistory.$inferInsert;
export type Badge = typeof badges.$inferSelect;
export type NewBadge = typeof badges.$inferInsert;
export type UserBadge = typeof userBadges.$inferSelect;
export type NewUserBadge = typeof userBadges.$inferInsert;
export type IdentityVerification = typeof identityVerifications.$inferSelect;
export type NewIdentityVerification = typeof identityVerifications.$inferInsert;
export type VerificationApplication = typeof verificationApplications.$inferSelect;
export type NewVerificationApplication = typeof verificationApplications.$inferInsert;
