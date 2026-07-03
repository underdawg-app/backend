import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  primaryKey,
  uniqueIndex,
  index,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { users } from './identity.js';
import {
  postVisibilityEnum,
  postStatusEnum,
  mediaTypeEnum,
  tagTypeEnum,
  reactionTargetEnum,
  shareTargetEnum,
} from './enums.js';

// ---------- posts ----------
export const posts = pgTable(
  'posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    caption: text('caption'),
    visibility: postVisibilityEnum('visibility').notNull().default('public'),
    location: text('location'),
    commentsEnabled: boolean('comments_enabled').notNull().default(true),
    sharingEnabled: boolean('sharing_enabled').notNull().default(true),
    downloadEnabled: boolean('download_enabled').notNull().default(false),
    ageRestricted: boolean('age_restricted').notNull().default(false),
    status: postStatusEnum('status').notNull().default('draft'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    authorIdx: index('posts_author_idx').on(t.authorId),
    statusIdx: index('posts_status_idx').on(t.status, t.publishedAt),
  }),
);

// ---------- media_assets ----------
export const mediaAssets = pgTable(
  'media_assets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
    type: mediaTypeEnum('type').notNull(),
    url: text('url').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    position: integer('position').notNull().default(0),
  },
  (t) => ({
    postIdx: index('media_assets_post_idx').on(t.postId),
  }),
);

// ---------- tags — craft tags + hashtags ----------
export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  type: tagTypeEnum('type').notNull().default('hashtag'),
  usageCount: integer('usage_count').notNull().default(0),
});

// ---------- post_tags — junction ----------
export const postTags = pgTable(
  'post_tags',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.tagId] }),
    tagIdx: index('post_tags_tag_idx').on(t.tagId),
  }),
);

// ---------- post_mentions — junction ----------
export const postMentions = pgTable(
  'post_mentions',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    mentionedUserId: uuid('mentioned_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.mentionedUserId] }),
    userIdx: index('post_mentions_user_idx').on(t.mentionedUserId),
  }),
);

// ---------- comments — threaded ----------
export const comments = pgTable(
  'comments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id').references((): AnyPgColumn => comments.id, {
      onDelete: 'cascade',
    }),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    postIdx: index('comments_post_idx').on(t.postId),
    parentIdx: index('comments_parent_idx').on(t.parentId),
  }),
);

// ---------- reactions — likes on posts + comments ----------
export const reactions = pgTable(
  'reactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    targetType: reactionTargetEnum('target_type').notNull(),
    targetId: uuid('target_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex('reactions_user_target_uniq').on(t.userId, t.targetType, t.targetId),
    targetIdx: index('reactions_target_idx').on(t.targetType, t.targetId),
  }),
);

// ---------- saves — junction ----------
export const saves = pgTable(
  'saves',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.postId] }),
  }),
);

// ---------- reshares ----------
export const reshares = pgTable(
  'reshares',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    postIdx: index('reshares_post_idx').on(t.postId),
  }),
);

// ---------- post_shares — "send" action (message lives in Firebase) ----------
export const postShares = pgTable(
  'post_shares',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    targetType: shareTargetEnum('target_type').notNull(),
    firebaseThreadId: text('firebase_thread_id'),
    sharedAt: timestamp('shared_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    postIdx: index('post_shares_post_idx').on(t.postId),
  }),
);

// ---------- follows — edge graph ----------
export const follows = pgTable(
  'follows',
  {
    followerId: uuid('follower_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    followingId: uuid('following_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.followerId, t.followingId] }),
    followingIdx: index('follows_following_idx').on(t.followingId),
  }),
);

// ---------- Inferred types ----------
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type NewMediaAsset = typeof mediaAssets.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type Reaction = typeof reactions.$inferSelect;
export type NewReaction = typeof reactions.$inferInsert;
export type Reshare = typeof reshares.$inferSelect;
export type PostShare = typeof postShares.$inferSelect;
export type NewPostShare = typeof postShares.$inferInsert;
export type Follow = typeof follows.$inferSelect;
export type NewFollow = typeof follows.$inferInsert;
