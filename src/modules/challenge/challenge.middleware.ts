import type { FastifyReply, FastifyRequest } from 'fastify';
import { NotFoundError, ForbiddenError, UnauthorizedError } from '../../utils/errors.js';
import type { ChallengeRepository } from './challenge.repository.js';

/**
 * Route guard: ensures the authenticated user is the host of the challenge
 * identified by the `:id` route param. `app.authenticate` must run first.
 */
export function requireChallengeHost(repo: ChallengeRepository) {
  return async (req: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();

    const params = req.params as Record<string, string>;
    const challengeId = params['id'];

    const challenge = await repo.findById(challengeId);
    if (!challenge) throw new NotFoundError('Challenge not found');

    if (challenge.hostUserId !== req.user.id) {
      throw new ForbiddenError('Only the challenge host can perform this action');
    }
  };
}
