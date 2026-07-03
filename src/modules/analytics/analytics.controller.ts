import type { FastifyReply, FastifyRequest } from 'fastify';
import { HTTP } from '../../config/constants.js';
import { UnauthorizedError } from '../../utils/errors.js';
import type { AnalyticsService } from './analytics.service.js';
import type { CreateEventBody, ListEventsQuery, SummaryQuery } from './analytics.types.js';

export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  trackEvent = async (
    req: FastifyRequest<{ Body: CreateEventBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const event = await this.service.trackEvent(req.user.id, req.body);
    reply.status(HTTP.CREATED).send(event);
  };

  listEvents = async (
    req: FastifyRequest<{ Querystring: ListEventsQuery }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const events = await this.service.listEvents(req.user.id, req.query);
    reply.send({ data: events });
  };

  getSummary = async (
    req: FastifyRequest<{ Querystring: SummaryQuery }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const summary = await this.service.summarise(req.user.id, req.query);
    reply.send({ data: summary });
  };
}
