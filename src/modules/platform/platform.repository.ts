import { eq, and } from 'drizzle-orm';
import type { DB } from '../../db/client.js';
import {
  platformConnections,
  type PlatformConnection,
  type NewPlatformConnection,
} from '../../schema/index.js';

export class PlatformRepository {
  constructor(private readonly db: DB) {}

  async findAllByUserId(userId: string): Promise<PlatformConnection[]> {
    return this.db
      .select()
      .from(platformConnections)
      .where(eq(platformConnections.userId, userId));
  }

  async findById(id: string): Promise<PlatformConnection | undefined> {
    const [row] = await this.db
      .select()
      .from(platformConnections)
      .where(eq(platformConnections.id, id))
      .limit(1);
    return row;
  }

  async findByIdAndUserId(id: string, userId: string): Promise<PlatformConnection | undefined> {
    const [row] = await this.db
      .select()
      .from(platformConnections)
      .where(and(eq(platformConnections.id, id), eq(platformConnections.userId, userId)))
      .limit(1);
    return row;
  }

  async create(data: NewPlatformConnection): Promise<PlatformConnection> {
    const [row] = await this.db.insert(platformConnections).values(data).returning();
    return row;
  }

  async update(
    id: string,
    data: Partial<NewPlatformConnection>,
  ): Promise<PlatformConnection | undefined> {
    const [row] = await this.db
      .update(platformConnections)
      .set(data)
      .where(eq(platformConnections.id, id))
      .returning();
    return row;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(platformConnections).where(eq(platformConnections.id, id));
  }

  async syncNow(id: string): Promise<PlatformConnection | undefined> {
    const [row] = await this.db
      .update(platformConnections)
      .set({ lastSyncedAt: new Date() })
      .where(eq(platformConnections.id, id))
      .returning();
    return row;
  }
}
