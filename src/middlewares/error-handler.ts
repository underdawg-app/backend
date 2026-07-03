import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { HTTP } from '../config/constants.js';
import { isProd } from '../config/env.js';

export function errorHandler(
  err: FastifyError | Error,
  req: FastifyRequest,
  reply: FastifyReply,
): void {
  req.log.error({ err }, 'Request error');

  if (err instanceof AppError) {
    reply.status(err.statusCode).send({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof ZodError) {
    reply.status(HTTP.UNPROCESSABLE).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.flatten(),
      },
    });
    return;
  }

  const fastifyErr = err as FastifyError;
  if (fastifyErr.statusCode && fastifyErr.statusCode < 500) {
    reply.status(fastifyErr.statusCode).send({
      error: { code: fastifyErr.code ?? 'CLIENT_ERROR', message: fastifyErr.message },
    });
    return;
  }

  reply.status(HTTP.INTERNAL).send({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProd ? 'Internal server error' : err.message,
      ...(isProd ? {} : { stack: err.stack }),
    },
  });
}
