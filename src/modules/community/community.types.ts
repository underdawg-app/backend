import type { z } from 'zod';
import type {
  createCommunityBodySchema,
  updateCommunityBodySchema,
  communityParamSchema,
  communityQuerySchema,
  addPostBodySchema,
  createEventBodySchema,
  eventParamSchema,
  rsvpBodySchema,
  createPollBodySchema,
  pollParamSchema,
  voteBodySchema,
  askQuestionBodySchema,
  userParamSchema,
  questionParamSchema,
  answerBodySchema,
} from './community.validator.js';

import type {
  Community,
  NewCommunity,
  CommunityMember,
  CommunityPost,
  CommunityEvent,
  NewCommunityEvent,
  EventRsvp,
  Poll,
  NewPoll,
  PollOption,
  PollVote,
  QnaQuestion,
  NewQnaQuestion,
  QnaAnswer,
} from '../../schema/index.js';

export type {
  Community,
  NewCommunity,
  CommunityMember,
  CommunityPost,
  CommunityEvent,
  NewCommunityEvent,
  EventRsvp,
  Poll,
  NewPoll,
  PollOption,
  PollVote,
  QnaQuestion,
  NewQnaQuestion,
  QnaAnswer,
};

export type CreateCommunityBody = z.infer<typeof createCommunityBodySchema>;
export type UpdateCommunityBody = z.infer<typeof updateCommunityBodySchema>;
export type CommunityParam = z.infer<typeof communityParamSchema>;
export type CommunityQuery = z.infer<typeof communityQuerySchema>;
export type AddPostBody = z.infer<typeof addPostBodySchema>;
export type CreateEventBody = z.infer<typeof createEventBodySchema>;
export type EventParam = z.infer<typeof eventParamSchema>;
export type RsvpBody = z.infer<typeof rsvpBodySchema>;
export type CreatePollBody = z.infer<typeof createPollBodySchema>;
export type PollParam = z.infer<typeof pollParamSchema>;
export type VoteBody = z.infer<typeof voteBodySchema>;
export type AskQuestionBody = z.infer<typeof askQuestionBodySchema>;
export type UserParam = z.infer<typeof userParamSchema>;
export type QuestionParam = z.infer<typeof questionParamSchema>;
export type AnswerBody = z.infer<typeof answerBodySchema>;

export interface PollWithOptions {
  poll: Poll;
  options: Array<{ option: PollOption; voteCount: number }>;
}

export interface CommunityWithMemberCount {
  community: Community;
  memberCount: number;
}
