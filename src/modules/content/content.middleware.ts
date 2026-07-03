import type { FastifyReply, FastifyRequest } from 'fastify';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../../utils/errors.js';
import type { ContentRepository } from './content.repository.js';

/**
 * Route guard: loads the post by `:id` param, throws NotFound if missing,
 * throws Forbidden if the authenticated user is not the post author.
 * `app.authenticate` must run first.
 */
export function requirePostAuthor(repo: ContentRepository) {
  return async (req: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const params = req.params as Record<string, string>;
    const postId = params['id'];
    const post = await repo.findPostById(postId);
    if (!post) throw new NotFoundError('Post not found');
    if (post.authorId !== req.user.id) throw new ForbiddenError('Not the post author');
  };
}
