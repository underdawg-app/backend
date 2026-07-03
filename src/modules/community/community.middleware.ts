import type { FastifyReply, FastifyRequest } from 'fastify';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../../utils/errors.js';
import type { CommunityRepository } from './community.repository.js';

/**
 * Route-level guard: loads the community by `:id` param, throws 404 if missing,
 * throws 403 if the authenticated user is not the owner.
 * Requires `app.authenticate` to run first.
 */
export function requireCommunityOwner(repo: CommunityRepository) {
  return async (req: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const params = req.params as Record<string, string>;
    const community = await repo.findCommunityById(params['id']);
    if (!community) throw new NotFoundError('Community not found');
    if (community.ownerId !== req.user.id) throw new ForbiddenError('Only the owner can perform this action');
  };
}
