import { sql } from 'drizzle-orm';
import type { DB } from '../../db/client.js';
import type { HealthResponse, ReadyResponse } from './health.schema.js';

export class HealthService {
  constructor(private readonly db: DB) {}

  getHealth(): HealthResponse {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.1.0',
    };
  }

  async getReadiness(): Promise<ReadyResponse> {
    let dbStatus: 'ok' | 'fail' = 'ok';
    try {
      await this.db.execute(sql`select 1`);
    } catch {
      dbStatus = 'fail';
    }

    return {
      status: dbStatus === 'ok' ? 'ready' : 'not_ready',
      checks: { database: dbStatus },
    };
  }
}
