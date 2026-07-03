import { clampLimit } from './analytics.middleware.js';
import type { AnalyticsRepository } from './analytics.repository.js';
import type { AnalyticsEvent, CreateEventBody, EventSummaryRow, ListEventsQuery, SummaryQuery } from './analytics.types.js';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export class AnalyticsService {
  constructor(private readonly repo: AnalyticsRepository) {}

  async trackEvent(actorId: string, input: CreateEventBody): Promise<AnalyticsEvent> {
    return this.repo.insert({
      actorId,
      type: input.type,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      metadata: input.metadata ?? null,
    });
  }

  listEvents(actorId: string, query: ListEventsQuery): Promise<AnalyticsEvent[]> {
    return this.repo.listByActor(actorId, {
      type: query.type,
      targetType: query.targetType,
      limit: clampLimit(query.limit, MAX_LIMIT, DEFAULT_LIMIT),
    });
  }

  summarise(actorId: string, query: SummaryQuery): Promise<EventSummaryRow[]> {
    let since: Date | undefined;
    if (query.sinceDays !== undefined) {
      since = new Date(Date.now() - query.sinceDays * 24 * 60 * 60 * 1000);
    }
    return this.repo.summariseByActor(actorId, {
      targetType: query.targetType,
      targetId: query.targetId,
      since,
    });
  }
}
