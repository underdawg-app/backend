import type { FastifyReply, FastifyRequest } from 'fastify';
import { HTTP } from '../config/constants.js';

export function notFoundHandler(req: FastifyRequest, reply: FastifyReply): void {
  reply.status(HTTP.NOT_FOUND).send({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`,
    },
  });
}
