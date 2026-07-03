import { desc, eq } from 'drizzle-orm';
import type { DB } from '../../db/client.js';
import { uploads, type Upload, type NewUpload } from '../../schema/index.js';

export class MediaRepository {
  constructor(private readonly db: DB) {}

  async create(data: NewUpload): Promise<Upload> {
    const [row] = await this.db.insert(uploads).values(data).returning();
    return row;
  }

  listByOwner(ownerId: string): Promise<Upload[]> {
    return this.db
      .select()
      .from(uploads)
      .where(eq(uploads.ownerId, ownerId))
      .orderBy(desc(uploads.createdAt));
  }

  async findById(id: string): Promise<Upload | undefined> {
    const [row] = await this.db.select().from(uploads).where(eq(uploads.id, id)).limit(1);
    return row;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(uploads).where(eq(uploads.id, id));
  }
}
