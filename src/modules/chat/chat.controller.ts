import type { FastifyReply, FastifyRequest } from 'fastify';
import { HTTP } from '../../config/constants.js';
import { UnauthorizedError } from '../../utils/errors.js';
import type { ChatService } from './chat.service.js';
import type {
  ActivityBody,
  AddParticipantBody,
  ConversationIdParam,
  ConversationListQuery,
  ConversationSearchQuery,
  CreateConversationBody,
  CreateNoteBody,
  NoteIdParam,
  ParticipantParam,
} from './chat.types.js';

export class ChatController {
  constructor(private readonly service: ChatService) {}

  // ----- realtime auth -----

  firebaseToken = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const token = await this.service.firebaseToken(req.user.id);
    reply.send({ token });
  };

  // ----- conversations -----

  listConversations = async (
    req: FastifyRequest<{ Querystring: ConversationListQuery }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const { tab, limit, cursor } = req.query;
    const result = await this.service.listConversations(req.user.id, tab, limit, cursor);
    reply.send(result);
  };

  createConversation = async (
    req: FastifyRequest<{ Body: CreateConversationBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const result = await this.service.createConversation(req.user.id, req.body);
    reply.status(HTTP.CREATED).send(result);
  };

  search = async (
    req: FastifyRequest<{ Querystring: ConversationSearchQuery }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const data = await this.service.search(req.user.id, req.query.q);
    reply.send({ data });
  };

  getConversation = async (
    req: FastifyRequest<{ Params: ConversationIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const result = await this.service.getConversation(req.user.id, req.params.id);
    reply.send(result);
  };

  addParticipant = async (
    req: FastifyRequest<{ Params: ConversationIdParam; Body: AddParticipantBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.addParticipant(req.user.id, req.params.id, req.body.userId);
    reply.status(HTTP.NO_CONTENT).send();
  };

  removeParticipant = async (
    req: FastifyRequest<{ Params: ParticipantParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.removeParticipant(req.user.id, req.params.id, req.params.userId);
    reply.status(HTTP.NO_CONTENT).send();
  };

  markRead = async (
    req: FastifyRequest<{ Params: ConversationIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.markRead(req.user.id, req.params.id);
    reply.status(HTTP.NO_CONTENT).send();
  };

  archive = async (
    req: FastifyRequest<{ Params: ConversationIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.setArchived(req.user.id, req.params.id, true);
    reply.status(HTTP.NO_CONTENT).send();
  };

  unarchive = async (
    req: FastifyRequest<{ Params: ConversationIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.setArchived(req.user.id, req.params.id, false);
    reply.status(HTTP.NO_CONTENT).send();
  };

  softDelete = async (
    req: FastifyRequest<{ Params: ConversationIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.softDelete(req.user.id, req.params.id);
    reply.status(HTTP.NO_CONTENT).send();
  };

  accept = async (
    req: FastifyRequest<{ Params: ConversationIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.accept(req.user.id, req.params.id);
    reply.status(HTTP.NO_CONTENT).send();
  };

  recordActivity = async (
    req: FastifyRequest<{ Params: ConversationIdParam; Body: ActivityBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.recordActivity(req.user.id, req.params.id, req.body);
    reply.status(HTTP.NO_CONTENT).send();
  };

  // ----- notes -----

  createNote = async (
    req: FastifyRequest<{ Body: CreateNoteBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const note = await this.service.createNote(req.user.id, req.body.content, req.body.ttlHours);
    reply.status(HTTP.CREATED).send(note);
  };

  listNotes = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const data = await this.service.listNotes(req.user.id);
    reply.send({ data });
  };

  deleteNote = async (
    req: FastifyRequest<{ Params: NoteIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.deleteNote(req.user.id, req.params.id);
    reply.status(HTTP.NO_CONTENT).send();
  };
}
