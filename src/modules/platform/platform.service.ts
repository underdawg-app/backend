import { NotFoundError } from '../../utils/errors.js';
import type { PlatformRepository } from './platform.repository.js';
import type {
  PlatformConnection,
  CreateConnectionBody,
  UpdateConnectionBody,
} from './platform.types.js';

export class PlatformService {
  constructor(private readonly repo: PlatformRepository) {}

  listConnections(userId: string): Promise<PlatformConnection[]> {
    return this.repo.findAllByUserId(userId);
  }

  async createConnection(
    userId: string,
    input: CreateConnectionBody,
  ): Promise<PlatformConnection> {
    return this.repo.create({
      userId,
      platform: input.platform,
      accessToken: input.accessToken ?? null,
      refreshToken: input.refreshToken ?? null,
      status: 'connected',
    });
  }

  async getConnection(id: string, userId: string): Promise<PlatformConnection> {
    const connection = await this.repo.findByIdAndUserId(id, userId);
    if (!connection) throw new NotFoundError('Platform connection not found');
    return connection;
  }

  async updateConnection(
    id: string,
    userId: string,
    input: UpdateConnectionBody,
  ): Promise<PlatformConnection> {
    // Verify ownership first
    const existing = await this.repo.findByIdAndUserId(id, userId);
    if (!existing) throw new NotFoundError('Platform connection not found');

    const updated = await this.repo.update(id, {
      ...(input.accessToken !== undefined && { accessToken: input.accessToken }),
      ...(input.refreshToken !== undefined && { refreshToken: input.refreshToken }),
      ...(input.status !== undefined && { status: input.status }),
    });
    if (!updated) throw new NotFoundError('Platform connection not found');
    return updated;
  }

  async deleteConnection(id: string, userId: string): Promise<void> {
    const existing = await this.repo.findByIdAndUserId(id, userId);
    if (!existing) throw new NotFoundError('Platform connection not found');
    await this.repo.delete(id);
  }

  async syncConnection(id: string, userId: string): Promise<PlatformConnection> {
    const existing = await this.repo.findByIdAndUserId(id, userId);
    if (!existing) throw new NotFoundError('Platform connection not found');

    const synced = await this.repo.syncNow(id);
    if (!synced) throw new NotFoundError('Platform connection not found');
    return synced;
  }
}
