import { eq, and, desc, count, gte } from 'drizzle-orm';
import type { DB } from '../../db/client.js';
import {
  analyticsEvents,
  type AnalyticsEvent,
  type NewAnalyticsEvent,
} from '../../schema/index.js';
import type { EventSummaryRow } from './analytics.types.js';

export class AnalyticsRepository {
  constructor(private readonly db: DB) {}

  async insert(data: NewAnalyticsEvent): Promise<AnalyticsEvent> {
    const [row] = await this.db.insert(analyticsEvents).values(data).returning();
    return row;
  }

  async listByActor(
    actorId: string,
    opts: { type?: string; targetType?: string; limit: number },
  ): Promise<AnalyticsEvent[]> {
    const filters = [eq(analyticsEvents.actorId, actorId)];
    if (opts.type) filters.push(eq(analyticsEvents.type, opts.type));
    if (opts.targetType) filters.push(eq(analyticsEvents.targetType, opts.targetType));

    return this.db
      .select()
      .from(analyticsEvents)
      .where(and(...filters))
      .orderBy(desc(analyticsEvents.occurredAt))
      .limit(opts.limit);
  }

  async summariseByActor(
    actorId: string,
    opts: { targetType?: string; targetId?: string; since?: Date },
  ): Promise<EventSummaryRow[]> {
    const filters = [eq(analyticsEvents.actorId, actorId)];
    if (opts.targetType) filters.push(eq(analyticsEvents.targetType, opts.targetType));
    if (opts.targetId) filters.push(eq(analyticsEvents.targetId, opts.targetId));
    if (opts.since) filters.push(gte(analyticsEvents.occurredAt, opts.since));

    const rows = await this.db
      .select({ type: analyticsEvents.type, count: count() })
      .from(analyticsEvents)
      .where(and(...filters))
      .groupBy(analyticsEvents.type);

    return rows.map((r) => ({ type: r.type, count: Number(r.count) }));
  }
}
