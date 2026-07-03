import { z } from 'zod';

const conversationCategory = z.enum(['primary', 'deal', 'collab']);

export const conversationListQuerySchema = z.object({
  tab: z.enum(['all', 'primary', 'deal', 'collab', 'requests']).default('all'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const createConversationBodySchema = z.object({
  participantIds: z.array(z.string().uuid()).min(1).max(50),
  category: conversationCategory.optional(),
  isGroup: z.boolean().optional(),
  title: z.string().min(1).max(120).optional(),
  gigApplicationId: z.string().uuid().optional(),
  collaborationId: z.string().uuid().optional(),
});

export const addParticipantBodySchema = z.object({ userId: z.string().uuid() });

export const activityBodySchema = z.object({ preview: z.string().min(1).max(500) });

export const conversationSearchQuerySchema = z.object({ q: z.string().min(1).max(100) });

export const createNoteBodySchema = z.object({
  content: z.string().min(1).max(280),
  ttlHours: z.coerce.number().int().min(1).max(168).optional(),
});

export const conversationIdParamSchema = z.object({ id: z.string().uuid() });
export const participantParamSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
});
export const noteIdParamSchema = z.object({ id: z.string().uuid() });
