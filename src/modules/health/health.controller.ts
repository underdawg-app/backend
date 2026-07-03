import type { FastifyReply, FastifyRequest } from 'fastify';
import type { HealthService } from './health.service.js';

export class HealthController {
  constructor(private readonly service: HealthService) {}

  health = async (_req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const result = this.service.getHealth();
    reply.send(result);
  };

  ready = async (_req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const result = await this.service.getReadiness();
    const code = result.status === 'ready' ? 200 : 503;
    reply.status(code).send(result);
  };
}
