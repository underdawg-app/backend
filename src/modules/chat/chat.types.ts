import type { z } from 'zod';
import type {
  conversationListQuerySchema,
  createConversationBodySchema,
  addParticipantBodySchema,
  activityBodySchema,
  conversationSearchQuerySchema,
  createNoteBodySchema,
  conversationIdParamSchema,
  participantParamSchema,
  noteIdParamSchema,
} from './chat.validator.js';

export type {
  Conversation,
  NewConversation,
  ConversationParticipant,
  NewConversationParticipant,
  Note,
  NewNote,
} from '../../schema/index.js';

import type { Conversation } from '../../schema/index.js';

export type ConversationListQuery = z.infer<typeof conversationListQuerySchema>;
export type CreateConversationBody = z.infer<typeof createConversationBodySchema>;
export type AddParticipantBody = z.infer<typeof addParticipantBodySchema>;
export type ActivityBody = z.infer<typeof activityBodySchema>;
export type ConversationSearchQuery = z.infer<typeof conversationSearchQuerySchema>;
export type CreateNoteBody = z.infer<typeof createNoteBodySchema>;
export type ConversationIdParam = z.infer<typeof conversationIdParamSchema>;
export type ParticipantParam = z.infer<typeof participantParamSchema>;
export type NoteIdParam = z.infer<typeof noteIdParamSchema>;

export type ConversationTab = ConversationListQuery['tab'];
export type RequestState = 'pending' | 'accepted';

export interface ParticipantView {
  userId: string;
  role: string;
  requestState: RequestState;
  username: string | null;
  displayName: string | null;
  photoUrl: string | null;
}

export interface MyParticipantState {
  role: string;
  requestState: RequestState;
  archivedAt: Date | null;
  mutedAt: Date | null;
  lastReadAt: Date | null;
}

export interface ConversationView {
  conversation: Conversation;
  participants: ParticipantView[];
  myState: MyParticipantState;
}

export interface ConversationListResult {
  data: ConversationView[];
  nextCursor: string | null;
}

export interface NoteView {
  id: string;
  content: string;
  expiresAt: Date;
  createdAt: Date;
  user: { id: string; username: string | null; displayName: string | null; photoUrl: string | null };
}
