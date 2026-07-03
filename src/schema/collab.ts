import { pgTable, uuid, text, jsonb, primaryKey, index } from 'drizzle-orm/pg-core';
import { users } from './identity.js';
import { collabStatusEnum, collabRequestStatusEnum, collaborationStatusEnum } from './enums.js';

// ---------- collab_settings — 1:1 with user ----------
export const collabSettings = pgTable('collab_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: collabStatusEnum('status').notNull().default('closed'),
  interests: text('interests').array(),
});

// ---------- collab_requests ----------
export const collabRequests = pgTable(
  'collab_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fromUserId: uuid('from_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    toUserId: uuid('to_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    message: text('message'),
    status: collabRequestStatusEnum('status').notNull().default('pending'),
  },
  (t) => ({
    toUserIdx: index('collab_requests_to_user_idx').on(t.toUserId),
  }),
);

// ---------- collaborations (chat lives in Firebase) ----------
export const collaborations = pgTable('collaborations', {
  id: uuid('id').defaultRandom().primaryKey(),
  firebaseThreadId: text('firebase_thread_id'),
  attribution: jsonb('attribution'),
  status: collaborationStatusEnum('status').notNull().default('active'),
});

// ---------- collaboration_participants — junction ----------
export const collaborationParticipants = pgTable(
  'collaboration_participants',
  {
    collaborationId: uuid('collaboration_id')
      .notNull()
      .references(() => collaborations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.collaborationId, t.userId] }),
  }),
);

// ---------- Inferred types ----------
export type CollabSetting = typeof collabSettings.$inferSelect;
export type NewCollabSetting = typeof collabSettings.$inferInsert;
export type CollabRequest = typeof collabRequests.$inferSelect;
export type NewCollabRequest = typeof collabRequests.$inferInsert;
export type Collaboration = typeof collaborations.$inferSelect;
export type NewCollaboration = typeof collaborations.$inferInsert;
export type CollaborationParticipant = typeof collaborationParticipants.$inferSelect;
export type NewCollaborationParticipant = typeof collaborationParticipants.$inferInsert;
