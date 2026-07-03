import { pgTable, uuid, text, index } from 'drizzle-orm/pg-core';
import { users } from './identity.js';
import { disclosureTriggerEnum, dataRequestTypeEnum, dataRequestStatusEnum } from './enums.js';

// ---------- disclosure_rules — required ad/paid-collab tags ----------
export const disclosureRules = pgTable('disclosure_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  trigger: disclosureTriggerEnum('trigger').notNull(),
  requiredTags: text('required_tags').array(),
});

// ---------- data_requests — GDPR export/delete ----------
export const dataRequests = pgTable(
  'data_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: dataRequestTypeEnum('type').notNull(),
    status: dataRequestStatusEnum('status').notNull().default('pending'),
  },
  (t) => ({
    userIdx: index('data_requests_user_idx').on(t.userId),
  }),
);

// ---------- Inferred types ----------
export type DisclosureRule = typeof disclosureRules.$inferSelect;
export type NewDisclosureRule = typeof disclosureRules.$inferInsert;
export type DataRequest = typeof dataRequests.$inferSelect;
export type NewDataRequest = typeof dataRequests.$inferInsert;
