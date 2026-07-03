import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  date,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './identity.js';
import { socialPlatformEnum, connectionStatusEnum, audienceDimensionEnum } from './enums.js';

// ---------- platform_connections — connected social accounts ----------
export const platformConnections = pgTable(
  'platform_connections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    platform: socialPlatformEnum('platform').notNull(),
    accessToken: text('access_token'), // encrypted at app layer
    refreshToken: text('refresh_token'), // encrypted at app layer
    status: connectionStatusEnum('status').notNull().default('connected'),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  },
  (t) => ({
    userIdx: index('platform_connections_user_idx').on(t.userId),
  }),
);

// ---------- follower_snapshots — daily history → growth trend ----------
export const followerSnapshots = pgTable(
  'follower_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    platformConnectionId: uuid('platform_connection_id')
      .notNull()
      .references(() => platformConnections.id, { onDelete: 'cascade' }),
    followerCount: integer('follower_count').notNull().default(0),
    capturedOn: date('captured_on').notNull(),
  },
  (t) => ({
    connectionIdx: index('follower_snapshots_connection_idx').on(t.platformConnectionId, t.capturedOn),
  }),
);

// ---------- audience_demographics ----------
export const audienceDemographics = pgTable(
  'audience_demographics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    platform: socialPlatformEnum('platform').notNull(),
    dimension: audienceDimensionEnum('dimension').notNull(),
    bucket: text('bucket').notNull(),
    pct: numeric('pct', { precision: 5, scale: 2 }).notNull(),
  },
  (t) => ({
    userIdx: index('audience_demographics_user_idx').on(t.userId),
  }),
);

// ---------- top_fans ----------
export const topFans = pgTable(
  'top_fans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fanRef: text('fan_ref').notNull(),
    engagementScore: integer('engagement_score').notNull().default(0),
  },
  (t) => ({
    creatorIdx: index('top_fans_creator_idx').on(t.creatorId),
  }),
);

// ---------- Inferred types ----------
export type PlatformConnection = typeof platformConnections.$inferSelect;
export type NewPlatformConnection = typeof platformConnections.$inferInsert;
export type FollowerSnapshot = typeof followerSnapshots.$inferSelect;
export type NewFollowerSnapshot = typeof followerSnapshots.$inferInsert;
export type AudienceDemographic = typeof audienceDemographics.$inferSelect;
export type NewAudienceDemographic = typeof audienceDemographics.$inferInsert;
export type TopFan = typeof topFans.$inferSelect;
export type NewTopFan = typeof topFans.$inferInsert;
