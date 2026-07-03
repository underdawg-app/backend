import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { uploadResourceTypeEnum } from './enums.js';
import { users } from './identity.js';

// ---------- uploads — canonical media library (Cloudinary-backed) ----------
// One row per uploaded asset. Reused everywhere a user uploads media (profile
// photo, post media, portfolio pieces, chat attachments). Post rendering still
// uses media_assets; its `url` is filled from an upload's secureUrl.
export const uploads = pgTable(
  'uploads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    resourceType: uploadResourceTypeEnum('resource_type').notNull(),
    cloudinaryPublicId: text('cloudinary_public_id').notNull(),
    url: text('url').notNull(),
    secureUrl: text('secure_url').notNull(),
    format: text('format'),
    bytes: integer('bytes'),
    width: integer('width'),
    height: integer('height'),
    durationSec: integer('duration_sec'),
    originalFilename: text('original_filename'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ownerIdx: index('uploads_owner_idx').on(t.ownerId),
  }),
);

export type Upload = typeof uploads.$inferSelect;
export type NewUpload = typeof uploads.$inferInsert;
