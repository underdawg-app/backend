import { pgTable, uuid, text, boolean, primaryKey, index } from 'drizzle-orm/pg-core';
import { users } from './identity.js';
import { themeEnum, downloadQualityEnum, privacyScopeEnum } from './enums.js';

// ---------- user_settings — 1:1 with user ----------
export const userSettings = pgTable('user_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  language: text('language').notNull().default('en'),
  theme: themeEnum('theme').notNull().default('system'),
  autoplay: boolean('autoplay').notNull().default(true),
  dataSaver: boolean('data_saver').notNull().default(false),
  downloadQuality: downloadQualityEnum('download_quality').notNull().default('auto'),
  whoCanMessage: privacyScopeEnum('who_can_message').notNull().default('everyone'),
  whoCanComment: privacyScopeEnum('who_can_comment').notNull().default('everyone'),
  whoCanSeeActivity: privacyScopeEnum('who_can_see_activity').notNull().default('everyone'),
});

// ---------- block_list — junction ----------
export const blockList = pgTable(
  'block_list',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    targetUserId: uuid('target_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.targetUserId] }),
    targetIdx: index('block_list_target_idx').on(t.targetUserId),
  }),
);

// ---------- mute_list — junction ----------
export const muteList = pgTable(
  'mute_list',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    targetUserId: uuid('target_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.targetUserId] }),
    targetIdx: index('mute_list_target_idx').on(t.targetUserId),
  }),
);

// ---------- Inferred types ----------
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
export type BlockListEntry = typeof blockList.$inferSelect;
export type NewBlockListEntry = typeof blockList.$inferInsert;
export type MuteListEntry = typeof muteList.$inferSelect;
export type NewMuteListEntry = typeof muteList.$inferInsert;
