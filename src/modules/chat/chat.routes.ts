import type { FastifyInstance } from 'fastify';
import { typedRouter } from '../../utils/route.js';
import { ChatController } from './chat.controller.js';
import { ChatRepository } from './chat.repository.js';
import { ChatService } from './chat.service.js';
import {
  activityBodySchema,
  addParticipantBodySchema,
  conversationIdParamSchema,
  conversationListQuerySchema,
  conversationSearchQuerySchema,
  createConversationBodySchema,
  createNoteBodySchema,
  noteIdParamSchema,
  participantParamSchema,
} from './chat.validator.js';

export async function chatRoutes(app: FastifyInstance): Promise<void> {
  const service = new ChatService(new ChatRepository(app.db), app.firebase);
  const controller = new ChatController(service);
  const router = typedRouter(app);

  // ----- realtime auth -----

  router.post(
    '/chat/firebase-token',
    {
      preHandler: [app.authenticate],
      schema: { tags: ['chat'], summary: 'Mint a Firebase custom token for the caller' },
    },
    controller.firebaseToken,
  );

  // ----- conversations -----

  router.get(
    '/chat/conversations',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['chat'],
        summary: 'List conversations (tab = all | primary | deal | collab | requests)',
        querystring: conversationListQuerySchema,
      },
    },
    controller.listConversations,
  );

  router.post(
    '/chat/conversations',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['chat'],
        summary: 'Create a direct or group conversation',
        body: createConversationBodySchema,
      },
    },
    controller.createConversation,
  );

  router.get(
    '/chat/conversations/search',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['chat'],
        summary: 'Search accepted conversations by title or participant',
        querystring: conversationSearchQuerySchema,
      },
    },
    controller.search,
  );

  router.get(
    '/chat/conversations/:id',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['chat'],
        summary: 'Get a conversation (participant only)',
        params: conversationIdParamSchema,
      },
    },
    controller.getConversation,
  );

  router.post(
    '/chat/conversations/:id/participants',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['chat'],
        summary: 'Add a participant',
        params: conversationIdParamSchema,
        body: addParticipantBodySchema,
      },
    },
    controller.addParticipant,
  );

  router.delete(
    '/chat/conversations/:id/participants/:userId',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['chat'],
        summary: 'Remove a participant (self, or admin removes others)',
        params: participantParamSchema,
      },
    },
    controller.removeParticipant,
  );

  router.post(
    '/chat/conversations/:id/read',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['chat'],
        summary: 'Mark a conversation read (clears unread badge)',
        params: conversationIdParamSchema,
      },
    },
    controller.markRead,
  );

  router.post(
    '/chat/conversations/:id/archive',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['chat'],
        summary: 'Archive a conversation (per-participant)',
        params: conversationIdParamSchema,
      },
    },
    controller.archive,
  );

  router.delete(
    '/chat/conversations/:id/archive',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['chat'],
        summary: 'Unarchive a conversation',
        params: conversationIdParamSchema,
      },
    },
    controller.unarchive,
  );

  router.delete(
    '/chat/conversations/:id',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['chat'],
        summary: 'Soft-delete a conversation (per-participant)',
        params: conversationIdParamSchema,
      },
    },
    controller.softDelete,
  );

  router.post(
    '/chat/conversations/:id/accept',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['chat'],
        summary: 'Accept a conversation request (moves out of REQUESTS)',
        params: conversationIdParamSchema,
      },
    },
    controller.accept,
  );

  router.post(
    '/chat/conversations/:id/activity',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['chat'],
        summary: 'Mirror last-message preview/time onto the conversation (sender call)',
        params: conversationIdParamSchema,
        body: activityBodySchema,
      },
    },
    controller.recordActivity,
  );

  // ----- notes -----

  router.post(
    '/chat/notes',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['chat'],
        summary: 'Create an ephemeral note for the chat top bar',
        body: createNoteBodySchema,
      },
    },
    controller.createNote,
  );

  router.get(
    '/chat/notes',
    {
      preHandler: [app.authenticate],
      schema: { tags: ['chat'], summary: "List caller's and followed users' active notes" },
    },
    controller.listNotes,
  );

  router.delete(
    '/chat/notes/:id',
    {
      preHandler: [app.authenticate],
      schema: { tags: ['chat'], summary: 'Delete an own note', params: noteIdParamSchema },
    },
    controller.deleteNote,
  );
}
