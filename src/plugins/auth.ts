import fp from 'fastify-plugin';
import { and, eq, isNull } from 'drizzle-orm';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { sessions, users, type User } from '../schema/index.js';
import { hashToken } from '../utils/crypto.js';
import { UnauthorizedError } from '../utils/errors.js';

/**
 * Signature of the `authenticate` preHandler. Typed with `any` route-generic so
 * that placing it in a route's `preHandler` array does not force the route
 * generic to `RouteGenericInterface` â€” that would erase the body/params/query
 * types TypeScript infers from the route handler.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AuthPreHandler = (req: FastifyRequest<any>, reply: FastifyReply) => Promise<void>;

declare module 'fastify' {
  interface FastifyInstance {
    /** preHandler that requires a valid bearer session token. */
    authenticate: AuthPreHandler;
  }
  interface FastifyRequest {
    /** Populated by `authenticate`. */
    user?: User;
    sessionId?: string;
  }
}

/**
 * Bearer-token auth. The opaque session token issued at login is sent as
 * `Authorization: Bearer <token>`; we look it up by its SHA-256 hash.
 */
export default fp(async (app) => {
  app.decorate('authenticate', async (req: FastifyRequest, _reply: FastifyReply) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing bearer token');
    }
    const token = header.slice('Bearer '.length).trim();
    const tokenHash = hashToken(token);

    const [session] = await app.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.refreshTokenHash, tokenHash), isNull(sessions.revokedAt)))
      .limit(1);

    if (!session) throw new UnauthorizedError('Invalid or expired session');

    const [user] = await app.db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (!user) throw new UnauthorizedError('User no longer exists');

    await app.db
      .update(sessions)
      .set({ lastSeenAt: new Date() })
      .where(eq(sessions.id, session.id));

    req.user = user;
    req.sessionId = session.id;
  });
});
