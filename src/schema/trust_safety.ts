import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './identity.js';
import {
  adminRoleEnum,
  reportTargetTypeEnum,
  reportStatusEnum,
  moderationActionTypeEnum,
  appealStatusEnum,
} from './enums.js';

// ---------- admins — SEPARATE model (internal, NOT signup; not in users) ----------
export const admins = pgTable('admins', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  adminRole: adminRoleEnum('admin_role').notNull().default('support'),
  permissions: jsonb('permissions'),
});

// ---------- reports ----------
export const reports = pgTable(
  'reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reporterId: uuid('reporter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    targetType: reportTargetTypeEnum('target_type').notNull(),
    targetId: uuid('target_id').notNull(),
    reason: text('reason'),
    status: reportStatusEnum('status').notNull().default('open'),
  },
  (t) => ({
    targetIdx: index('reports_target_idx').on(t.targetType, t.targetId),
    statusIdx: index('reports_status_idx').on(t.status),
  }),
);

// ---------- moderation_actions — admin audit log ----------
export const moderationActions = pgTable(
  'moderation_actions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    adminId: uuid('admin_id')
      .notNull()
      .references(() => admins.id, { onDelete: 'restrict' }),
    reportId: uuid('report_id').references(() => reports.id, { onDelete: 'set null' }),
    action: moderationActionTypeEnum('action').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    reportIdx: index('moderation_actions_report_idx').on(t.reportId),
  }),
);

// ---------- strikes (3-strike policy = count query) ----------
export const strikes = pgTable(
  'strikes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('strikes_user_idx').on(t.userId),
  }),
);

// ---------- appeals ----------
export const appeals = pgTable(
  'appeals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reportId: uuid('report_id').references(() => reports.id, { onDelete: 'set null' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: appealStatusEnum('status').notNull().default('pending'),
    windowExpiresAt: timestamp('window_expires_at', { withTimezone: true }),
  },
  (t) => ({
    userIdx: index('appeals_user_idx').on(t.userId),
  }),
);

// ---------- Inferred types ----------
export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type ModerationAction = typeof moderationActions.$inferSelect;
export type NewModerationAction = typeof moderationActions.$inferInsert;
export type Strike = typeof strikes.$inferSelect;
export type NewStrike = typeof strikes.$inferInsert;
export type Appeal = typeof appeals.$inferSelect;
export type NewAppeal = typeof appeals.$inferInsert;
