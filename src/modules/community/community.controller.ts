import type { FastifyReply, FastifyRequest } from 'fastify';
import { HTTP } from '../../config/constants.js';
import { UnauthorizedError } from '../../utils/errors.js';
import type { CommunityService } from './community.service.js';
import type {
  CreateCommunityBody,
  UpdateCommunityBody,
  CommunityParam,
  CommunityQuery,
  AddPostBody,
  CreateEventBody,
  EventParam,
  RsvpBody,
  CreatePollBody,
  PollParam,
  VoteBody,
  AskQuestionBody,
  UserParam,
  QuestionParam,
  AnswerBody,
} from './community.types.js';

export class CommunityController {
  constructor(private readonly service: CommunityService) {}

  // ----- communities -----
  createCommunity = async (
    req: FastifyRequest<{ Body: CreateCommunityBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const community = await this.service.createCommunity(req.body, req.user.id);
    reply.status(HTTP.CREATED).send(community);
  };

  listCommunities = async (
    req: FastifyRequest<{ Querystring: CommunityQuery }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const communities = await this.service.listCommunities(req.query.category);
    reply.send({ data: communities });
  };

  getCommunity = async (
    req: FastifyRequest<{ Params: CommunityParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const result = await this.service.getCommunity(req.params.id);
    reply.send(result);
  };

  updateCommunity = async (
    req: FastifyRequest<{ Params: CommunityParam; Body: UpdateCommunityBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const community = await this.service.updateCommunity(req.params.id, req.user.id, req.body);
    reply.send(community);
  };

  deleteCommunity = async (
    req: FastifyRequest<{ Params: CommunityParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.deleteCommunity(req.params.id, req.user.id);
    reply.status(HTTP.NO_CONTENT).send();
  };

  joinCommunity = async (
    req: FastifyRequest<{ Params: CommunityParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const member = await this.service.joinCommunity(req.params.id, req.user.id);
    reply.send(member);
  };

  leaveCommunity = async (
    req: FastifyRequest<{ Params: CommunityParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.leaveCommunity(req.params.id, req.user.id);
    reply.status(HTTP.NO_CONTENT).send();
  };

  listMembers = async (
    req: FastifyRequest<{ Params: CommunityParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const members = await this.service.listMembers(req.params.id);
    reply.send({ data: members });
  };

  // ----- community posts -----
  addPost = async (
    req: FastifyRequest<{ Params: CommunityParam; Body: AddPostBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const post = await this.service.addPost(req.params.id, req.body, req.user.id);
    reply.status(HTTP.CREATED).send(post);
  };

  listCommunityPosts = async (
    req: FastifyRequest<{ Params: CommunityParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const posts = await this.service.listCommunityPosts(req.params.id);
    reply.send({ data: posts });
  };

  // ----- events -----
  createEvent = async (
    req: FastifyRequest<{ Params: CommunityParam; Body: CreateEventBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const event = await this.service.createEvent(req.params.id, req.body, req.user.id);
    reply.status(HTTP.CREATED).send(event);
  };

  listEvents = async (
    req: FastifyRequest<{ Params: CommunityParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const events = await this.service.listEvents(req.params.id);
    reply.send({ data: events });
  };

  rsvpEvent = async (
    req: FastifyRequest<{ Params: EventParam; Body: RsvpBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const rsvp = await this.service.rsvpEvent(req.params.id, req.user.id, req.body.status);
    reply.send(rsvp);
  };

  // ----- polls -----
  createPoll = async (
    req: FastifyRequest<{ Body: CreatePollBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const result = await this.service.createPoll(req.body, req.user.id);
    reply.status(HTTP.CREATED).send(result);
  };

  getPoll = async (
    req: FastifyRequest<{ Params: PollParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const result = await this.service.getPoll(req.params.id);
    reply.send(result);
  };

  vote = async (
    req: FastifyRequest<{ Params: PollParam; Body: VoteBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const pollVote = await this.service.vote(req.params.id, req.body.optionId, req.user.id);
    reply.send(pollVote);
  };

  closePoll = async (
    req: FastifyRequest<{ Params: PollParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const poll = await this.service.closePoll(req.params.id, req.user.id);
    reply.send(poll);
  };

  // ----- q&a -----
  askQuestion = async (
    req: FastifyRequest<{ Params: UserParam; Body: AskQuestionBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const question = await this.service.askQuestion(req.params.userId, req.body, req.user.id);
    reply.status(HTTP.CREATED).send(question);
  };

  listAnsweredQuestions = async (
    req: FastifyRequest<{ Params: UserParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const questions = await this.service.listAnsweredQuestions(req.params.userId);
    reply.send({ data: questions });
  };

  answerQuestion = async (
    req: FastifyRequest<{ Params: QuestionParam; Body: AnswerBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const result = await this.service.answerQuestion(req.params.id, req.user.id, req.body.body);
    reply.status(HTTP.CREATED).send(result);
  };
}
