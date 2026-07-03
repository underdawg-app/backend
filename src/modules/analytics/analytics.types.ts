import type { z } from 'zod';
import type { AnalyticsEvent } from '../../schema/index.js';
import type {
  createEventBodySchema,
  listEventsQuerySchema,
  summaryQuerySchema,
} from './analytics.validator.js';

export type { AnalyticsEvent, NewAnalyticsEvent } from '../../schema/index.js';

export type CreateEventBody = z.infer<typeof createEventBodySchema>;
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
export type SummaryQuery = z.infer<typeof summaryQuerySchema>;

export interface EventSummaryRow {
  type: string;
  count: number;
}

/** Subset of AnalyticsEvent returned to callers. */
export type PublicEvent = AnalyticsEvent;
