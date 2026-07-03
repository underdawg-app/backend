import type { FastifyReply, FastifyRequest } from 'fastify';
import { UnauthorizedError } from '../../utils/errors.js';
import type { ProfileService } from './profile.service.js';
import type { ProfileUsernameParam } from './profile.types.js';

export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  getMe = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const result = await this.service.getMine(req.user.id);
    reply.send(result);
  };

  getByUsername = async (
    req: FastifyRequest<{ Params: ProfileUsernameParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const result = await this.service.getByUsername(req.user.id, req.params.username);
    reply.send(result);
  };
}
