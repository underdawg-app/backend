import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { conversationCategoryEnum, conversationRequestStateEnum } from './enums.js';
import { users } from './identity.js';

// Chat metadata only. Message bodies + realtime fan-out live in Firebase RTDB
// under /threads/$conversationId. The conversation `id` doubles as the Firebase
// thread key. Postgres is authoritative for membership and conversation state.

// ---------- conversations ----------
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    category: conversationCategoryEnum('category').notNull().default('primary'),
    isGroup: boolean('is_group').notNull().default(false),
    title: text('title'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Soft links to the originating record for deal/collab conversations (no FK
    // to keep this module decoupled from gigs/collab schema).
    gigApplicationId: uuid('gig_application_id'),
    collaborationId: uuid('collaboration_id'),
    lastMessagePreview: text('last_message_preview'),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    categoryIdx: index('conversations_category_idx').on(t.category),
    lastMessageIdx: index('conversations_last_message_idx').on(t.lastMessageAt),
  }),
);

// ---------- conversation_participants (M:N + per-participant state) ----------
export const conversationParticipants = pgTable(
  'conversation_participants',
  {
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'),
    requestState: conversationRequestStateEnum('request_state').notNull().default('accepted'),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    mutedAt: timestamp('muted_at', { withTimezone: true }),
    lastReadAt: timestamp('last_read_at', { withTimezone: true }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.conversationId, t.userId] }),
    userIdx: index('conversation_participants_user_idx').on(t.userId),
  }),
);

// ---------- notes — ephemeral status/notes shown atop the chat screen ----------
export const notes = pgTable(
  'notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('notes_user_idx').on(t.userId),
    expiresIdx: index('notes_expires_idx').on(t.expiresAt),
  }),
);

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type NewConversationParticipant = typeof conversationParticipants.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
