import type { FastifyReply, FastifyRequest } from 'fastify';
import { HTTP } from '../../config/constants.js';
import { UnauthorizedError } from '../../utils/errors.js';
import type { ChallengeService } from './challenge.service.js';
import type {
  CreateChallengeBody,
  UpdateChallengeBody,
  ListChallengesQuery,
  CreateEntryBody,
  CreateResultBody,
  Challenge,
} from './challenge.types.js';

export class ChallengeController {
  constructor(private readonly service: ChallengeService) {}

  create = async (
    req: FastifyRequest<{ Body: CreateChallengeBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const challenge = await this.service.create(req.body, req.user.id);
    reply.status(HTTP.CREATED).send(challenge);
  };

  list = async (
    req: FastifyRequest<{ Querystring: ListChallengesQuery }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const challenges = await this.service.list(req.query.status as Challenge['status'] | undefined);
    reply.send({ data: challenges });
  };

  getById = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const challenge = await this.service.getById(req.params.id);
    reply.send(challenge);
  };

  update = async (
    req: FastifyRequest<{ Params: { id: string }; Body: UpdateChallengeBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const challenge = await this.service.update(req.params.id, req.body);
    reply.send(challenge);
  };

  delete = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.delete(req.params.id);
    reply.status(HTTP.NO_CONTENT).send();
  };

  createEntry = async (
    req: FastifyRequest<{ Params: { id: string }; Body: CreateEntryBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const entry = await this.service.createEntry(req.params.id, req.body, req.user.id);
    reply.status(HTTP.CREATED).send(entry);
  };

  listEntries = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const entries = await this.service.listEntries(req.params.id);
    reply.send({ data: entries });
  };

  vote = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.vote(req.params.id, req.user.id);
    reply.status(HTTP.CREATED).send();
  };

  getLeaderboard = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const rows = await this.service.getLeaderboard(req.params.id);
    reply.send({ data: rows });
  };

  createResult = async (
    req: FastifyRequest<{ Params: { id: string }; Body: CreateResultBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const result = await this.service.createResult(req.params.id, req.body, req.user.id);
    reply.status(HTTP.CREATED).send(result);
  };

  listResults = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const results = await this.service.listResults(req.params.id);
    reply.send({ data: results });
  };
}
