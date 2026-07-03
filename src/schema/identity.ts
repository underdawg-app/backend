import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { userRoleEnum, creatorTypeEnum, authProviderEnum, otpPurposeEnum } from './enums.js';

// ---------- users — auth + profile core ----------
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    role: userRoleEnum('role').notNull().default('creator'),
    email: text('email').unique(),
    // Canonical phone key = national significant number (last 10 digits). The
    // dial/country code is stored separately so lookups never depend on CC
    // length or a leading '+'. Nullable: phone-first signup creates the user
    // before a handle is chosen. Postgres allows multiple NULLs under UNIQUE.
    phone: text('phone').unique(),
    phoneCountryCode: text('phone_country_code'),
    username: text('username').unique(),
    displayName: text('display_name'),
    bio: text('bio'),
    photoUrl: text('photo_url'),
    coverUrl: text('cover_url'),
    locationCity: text('location_city'),
    locationCountry: text('location_country'),
    creatorType: creatorTypeEnum('creator_type'),
    profileCompletionPct: integer('profile_completion_pct').notNull().default(0),
    isPrivate: boolean('is_private').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    roleIdx: index('users_role_idx').on(t.role),
    creatorTypeIdx: index('users_creator_type_idx').on(t.creatorType),
  }),
);

// ---------- auth_credentials — login methods ----------
export const authCredentials = pgTable(
  'auth_credentials',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: authProviderEnum('provider').notNull(),
    passwordHash: text('password_hash'),
    providerUid: text('provider_uid'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('auth_credentials_user_idx').on(t.userId),
    providerIdx: index('auth_credentials_provider_idx').on(t.provider, t.providerUid),
  }),
);

// ---------- otp_codes — phone OTP challenges ----------
export const otpCodes = pgTable(
  'otp_codes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    phone: text('phone').notNull(),
    codeHash: text('code_hash').notNull(),
    purpose: otpPurposeEnum('purpose').notNull().default('login'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    attempts: integer('attempts').notNull().default(0),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    phoneIdx: index('otp_codes_phone_idx').on(t.phone),
  }),
);

// ---------- sessions — multi-device ----------
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    device: text('device'),
    refreshTokenHash: text('refresh_token_hash').notNull(),
    ip: text('ip'),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('sessions_user_idx').on(t.userId),
    tokenIdx: index('sessions_token_idx').on(t.refreshTokenHash),
  }),
);

// ---------- niches / skills / interest_tags — lookup tables ----------
export const niches = pgTable('niches', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
});

export const skills = pgTable('skills', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
});

export const interestTags = pgTable('interest_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
});

// ---------- user_niches / user_skills — junctions (M:N) ----------
export const userNiches = pgTable(
  'user_niches',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    nicheId: uuid('niche_id')
      .notNull()
      .references(() => niches.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.nicheId] }),
  }),
);

export const userSkills = pgTable(
  'user_skills',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    skillId: uuid('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.skillId] }),
  }),
);

export const userInterests = pgTable(
  'user_interests',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    interestTagId: uuid('interest_tag_id')
      .notNull()
      .references(() => interestTags.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.interestTagId] }),
  }),
);

// ---------- manager_profiles — manager extras (role=manager) ----------
export const managerProfiles = pgTable('manager_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  specialties: text('specialties').array(),
  commissionRate: numeric('commission_rate', { precision: 5, scale: 2 }),
  pastSuccess: text('past_success'),
});

// ---------- Inferred types ----------
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AuthCredential = typeof authCredentials.$inferSelect;
export type NewAuthCredential = typeof authCredentials.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type OtpCode = typeof otpCodes.$inferSelect;
export type NewOtpCode = typeof otpCodes.$inferInsert;
export type Niche = typeof niches.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type InterestTag = typeof interestTags.$inferSelect;
export type ManagerProfile = typeof managerProfiles.$inferSelect;
export type NewManagerProfile = typeof managerProfiles.$inferInsert;
