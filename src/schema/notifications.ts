import { pgTable, uuid, text, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './identity.js';
import {
  notificationChannelEnum,
  notificationFrequencyEnum,
  pushPlatformEnum,
} from './enums.js';

// ---------- notifications ----------
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // open-ended notification type
    payload: jsonb('payload'),
    deepLink: text('deep_link'),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('notifications_user_idx').on(t.userId, t.createdAt),
  }),
);

// ---------- notification_preferences ----------
export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    channel: notificationChannelEnum('channel').notNull(),
    enabled: boolean('enabled').notNull().default(true),
    frequency: notificationFrequencyEnum('frequency').notNull().default('realtime'),
    quietHours: jsonb('quiet_hours'),
  },
  (t) => ({
    userIdx: index('notification_preferences_user_idx').on(t.userId),
  }),
);

// ---------- push_tokens ----------
export const pushTokens = pgTable(
  'push_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    platform: pushPlatformEnum('platform').notNull(),
  },
  (t) => ({
    userIdx: index('push_tokens_user_idx').on(t.userId),
  }),
);

// ---------- Inferred types ----------
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference = typeof notificationPreferences.$inferInsert;
export type PushToken = typeof pushTokens.$inferSelect;
export type NewPushToken = typeof pushTokens.$inferInsert;
