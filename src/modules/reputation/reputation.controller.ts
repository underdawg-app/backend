import type { FastifyReply, FastifyRequest } from 'fastify';
import { HTTP } from '../../config/constants.js';
import { UnauthorizedError } from '../../utils/errors.js';
import type { ReputationService } from './reputation.service.js';
import type { RecomputeBody, UserIdParam } from './reputation.types.js';

export class ReputationController {
  constructor(private readonly service: ReputationService) {}

  getByUserId = async (
    req: FastifyRequest<{ Params: UserIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const row = await this.service.getByUserId(req.params.userId);
    reply.send(row);
  };

  getMe = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const row = await this.service.getOrCreateMine(req.user.id);
    reply.send(row);
  };

  recomputeMe = async (
    req: FastifyRequest<{ Body: RecomputeBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const row = await this.service.recompute(req.user.id, req.body);
    reply.status(HTTP.OK).send(row);
  };
}
