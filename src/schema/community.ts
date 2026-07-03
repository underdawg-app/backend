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
} from 'drizzle-orm/pg-core';
import { users } from './identity.js';
import { posts, tags } from './content.js';
import { brands } from './gigs.js';
import { badges } from './reputation.js';
import {
  communityMemberRoleEnum,
  communityMemberStatusEnum,
  communityPostFlagEnum,
  communityEventKindEnum,
  rsvpStatusEnum,
  pollStatusEnum,
  qnaStatusEnum,
  challengeStatusEnum,
  challengeEntryStatusEnum,
} from './enums.js';

// ---------- communities — groups ----------
export const communities = pgTable(
  'communities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    rules: text('rules'),
    category: text('category'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ownerIdx: index('communities_owner_idx').on(t.ownerId),
  }),
);

// ---------- community_members — junction ----------
export const communityMembers = pgTable(
  'community_members',
  {
    communityId: uuid('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    memberRole: communityMemberRoleEnum('member_role').notNull().default('member'),
    status: communityMemberStatusEnum('status').notNull().default('active'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.communityId, t.userId] }),
    userIdx: index('community_members_user_idx').on(t.userId),
  }),
);

// ---------- community_posts — junction post <-> community + flag ----------
export const communityPosts = pgTable(
  'community_posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    communityId: uuid('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    pinned: boolean('pinned').notNull().default(false),
    flag: communityPostFlagEnum('flag').notNull().default('discussion'),
    addedBy: uuid('added_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    communityIdx: index('community_posts_community_idx').on(t.communityId),
    uniq: uniqueIndex('community_posts_uniq').on(t.communityId, t.postId),
  }),
);

// ---------- community_events — events + programs ----------
export const communityEvents = pgTable(
  'community_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    communityId: uuid('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    kind: communityEventKindEnum('kind').notNull().default('event'),
    title: text('title').notNull(),
    description: text('description'),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    location: text('location'),
    coverUrl: text('cover_url'),
  },
  (t) => ({
    communityIdx: index('community_events_community_idx').on(t.communityId),
  }),
);

// ---------- event_rsvps — junction ----------
export const eventRsvps = pgTable(
  'event_rsvps',
  {
    eventId: uuid('event_id')
      .notNull()
      .references(() => communityEvents.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: rsvpStatusEnum('status').notNull().default('going'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.eventId, t.userId] }),
  }),
);

// ---------- polls ----------
export const polls = pgTable(
  'polls',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    question: text('question').notNull(),
    multiSelect: boolean('multi_select').notNull().default(false),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    status: pollStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ownerIdx: index('polls_owner_idx').on(t.ownerId),
  }),
);

// ---------- poll_options ----------
export const pollOptions = pgTable(
  'poll_options',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    pollId: uuid('poll_id')
      .notNull()
      .references(() => polls.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    position: integer('position').notNull().default(0),
  },
  (t) => ({
    pollIdx: index('poll_options_poll_idx').on(t.pollId),
  }),
);

// ---------- poll_votes ----------
export const pollVotes = pgTable(
  'poll_votes',
  {
    pollId: uuid('poll_id')
      .notNull()
      .references(() => polls.id, { onDelete: 'cascade' }),
    optionId: uuid('option_id')
      .notNull()
      .references(() => pollOptions.id, { onDelete: 'cascade' }),
    voterId: uuid('voter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    votedAt: timestamp('voted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.pollId, t.optionId, t.voterId] }),
  }),
);

// ---------- qna_questions ----------
export const qnaQuestions = pgTable(
  'qna_questions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    targetUserId: uuid('target_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    askerId: uuid('asker_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    isAnonymous: boolean('is_anonymous').notNull().default(false),
    status: qnaStatusEnum('status').notNull().default('pending'),
    askedAt: timestamp('asked_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    targetIdx: index('qna_questions_target_idx').on(t.targetUserId),
  }),
);

// ---------- qna_answers ----------
export const qnaAnswers = pgTable(
  'qna_answers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => qnaQuestions.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    answeredAt: timestamp('answered_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    questionIdx: index('qna_answers_question_idx').on(t.questionId),
  }),
);

// ---------- challenges ----------
export const challenges = pgTable(
  'challenges',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    theme: text('theme').notNull(),
    hashtagTagId: uuid('hashtag_tag_id').references(() => tags.id, { onDelete: 'set null' }),
    hostUserId: uuid('host_user_id').references(() => users.id, { onDelete: 'set null' }),
    sponsorBrandId: uuid('sponsor_brand_id').references(() => brands.id, { onDelete: 'set null' }),
    rules: text('rules'),
    eligibility: text('eligibility'),
    prizes: text('prizes'),
    timeline: text('timeline'),
    judgingCriteria: text('judging_criteria'),
    category: text('category'),
    status: challengeStatusEnum('status').notNull().default('draft'),
  },
  (t) => ({
    statusIdx: index('challenges_status_idx').on(t.status),
  }),
);

// ---------- challenge_entries ----------
export const challengeEntries = pgTable(
  'challenge_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    challengeId: uuid('challenge_id')
      .notNull()
      .references(() => challenges.id, { onDelete: 'cascade' }),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    postId: uuid('post_id').references(() => posts.id, { onDelete: 'set null' }),
    status: challengeEntryStatusEnum('status').notNull().default('submitted'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    challengeIdx: index('challenge_entries_challenge_idx').on(t.challengeId),
    uniq: uniqueIndex('challenge_entries_uniq').on(t.challengeId, t.creatorId),
  }),
);

// ---------- challenge_votes ----------
export const challengeVotes = pgTable(
  'challenge_votes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    entryId: uuid('entry_id')
      .notNull()
      .references(() => challengeEntries.id, { onDelete: 'cascade' }),
    voterId: uuid('voter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    votedAt: timestamp('voted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex('challenge_votes_uniq').on(t.entryId, t.voterId),
  }),
);

// ---------- challenge_results ----------
export const challengeResults = pgTable(
  'challenge_results',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    challengeId: uuid('challenge_id')
      .notNull()
      .references(() => challenges.id, { onDelete: 'cascade' }),
    winnerEntryId: uuid('winner_entry_id')
      .notNull()
      .references(() => challengeEntries.id, { onDelete: 'cascade' }),
    placement: integer('placement').notNull().default(1),
    prize: text('prize'),
    badgeId: uuid('badge_id').references(() => badges.id, { onDelete: 'set null' }),
  },
  (t) => ({
    challengeIdx: index('challenge_results_challenge_idx').on(t.challengeId),
  }),
);

// ---------- community_channels — group chat lives in Firebase ----------
export const communityChannels = pgTable(
  'community_channels',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    communityId: uuid('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    firebaseThreadId: text('firebase_thread_id'),
  },
  (t) => ({
    communityIdx: index('community_channels_community_idx').on(t.communityId),
  }),
);

// ---------- Inferred types ----------
export type Community = typeof communities.$inferSelect;
export type NewCommunity = typeof communities.$inferInsert;
export type CommunityMember = typeof communityMembers.$inferSelect;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type CommunityEvent = typeof communityEvents.$inferSelect;
export type NewCommunityEvent = typeof communityEvents.$inferInsert;
export type EventRsvp = typeof eventRsvps.$inferSelect;
export type Poll = typeof polls.$inferSelect;
export type NewPoll = typeof polls.$inferInsert;
export type PollOption = typeof pollOptions.$inferSelect;
export type PollVote = typeof pollVotes.$inferSelect;
export type QnaQuestion = typeof qnaQuestions.$inferSelect;
export type NewQnaQuestion = typeof qnaQuestions.$inferInsert;
export type QnaAnswer = typeof qnaAnswers.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type NewChallenge = typeof challenges.$inferInsert;
export type ChallengeEntry = typeof challengeEntries.$inferSelect;
export type NewChallengeEntry = typeof challengeEntries.$inferInsert;
export type ChallengeVote = typeof challengeVotes.$inferSelect;
export type ChallengeResult = typeof challengeResults.$inferSelect;
export type CommunityChannel = typeof communityChannels.$inferSelect;
export type NewCommunityChannel = typeof communityChannels.$inferInsert;
