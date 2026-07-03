import { eq, and, asc } from 'drizzle-orm';
import type { DB } from '../../db/client.js';
import {
  portfolios,
  portfolioPieces,
  publicPageConfigs,
  openTo,
  rates,
  pastClients,
  type Portfolio,
  type NewPortfolio,
  type PortfolioPiece,
  type NewPortfolioPiece,
  type PublicPageConfig,
  type NewPublicPageConfig,
  type OpenTo,
  type NewOpenTo,
  type Rate,
  type NewRate,
  type PastClient,
  type NewPastClient,
} from '../../schema/index.js';

export class PortfolioRepository {
  constructor(private readonly db: DB) {}

  // ----- portfolios -----
  async findByUserId(userId: string): Promise<Portfolio | undefined> {
    const [row] = await this.db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, userId))
      .limit(1);
    return row;
  }

  async findById(id: string): Promise<Portfolio | undefined> {
    const [row] = await this.db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, id))
      .limit(1);
    return row;
  }

  async create(data: NewPortfolio): Promise<Portfolio> {
    const [row] = await this.db.insert(portfolios).values(data).returning();
    return row;
  }

  // ----- portfolio pieces -----
  async findPiecesByPortfolioId(portfolioId: string): Promise<PortfolioPiece[]> {
    return this.db
      .select()
      .from(portfolioPieces)
      .where(eq(portfolioPieces.portfolioId, portfolioId))
      .orderBy(asc(portfolioPieces.position), asc(portfolioPieces.createdAt));
  }

  async findPieceById(id: string): Promise<PortfolioPiece | undefined> {
    const [row] = await this.db
      .select()
      .from(portfolioPieces)
      .where(eq(portfolioPieces.id, id))
      .limit(1);
    return row;
  }

  async addPiece(data: NewPortfolioPiece): Promise<PortfolioPiece> {
    const [row] = await this.db.insert(portfolioPieces).values(data).returning();
    return row;
  }

  async updatePiece(id: string, data: Partial<NewPortfolioPiece>): Promise<PortfolioPiece | undefined> {
    const [row] = await this.db
      .update(portfolioPieces)
      .set(data)
      .where(eq(portfolioPieces.id, id))
      .returning();
    return row;
  }

  async deletePiece(id: string): Promise<void> {
    await this.db.delete(portfolioPieces).where(eq(portfolioPieces.id, id));
  }

  // ----- public page configs -----
  async findPublicConfigByUserId(userId: string): Promise<PublicPageConfig | undefined> {
    const [row] = await this.db
      .select()
      .from(publicPageConfigs)
      .where(eq(publicPageConfigs.userId, userId))
      .limit(1);
    return row;
  }

  async upsertPublicConfig(data: NewPublicPageConfig): Promise<PublicPageConfig> {
    const [row] = await this.db
      .insert(publicPageConfigs)
      .values(data)
      .onConflictDoUpdate({
        target: publicPageConfigs.userId,
        set: {
          visibility: data.visibility,
          hideStats: data.hideStats,
          hideRates: data.hideRates,
        },
      })
      .returning();
    return row;
  }

  // ----- open_to -----
  async findOpenToByUserId(userId: string): Promise<OpenTo[]> {
    return this.db.select().from(openTo).where(eq(openTo.userId, userId));
  }

  async replaceOpenTo(userId: string, items: Pick<NewOpenTo, 'type' | 'enabled'>[]): Promise<OpenTo[]> {
    return this.db.transaction(async (tx) => {
      await tx.delete(openTo).where(eq(openTo.userId, userId));
      if (items.length === 0) return [];
      return tx
        .insert(openTo)
        .values(items.map((item) => ({ userId, type: item.type, enabled: item.enabled })))
        .returning();
    });
  }

  // ----- rates -----
  async findPublicRatesByUserId(userId: string): Promise<Rate[]> {
    return this.db
      .select()
      .from(rates)
      .where(and(eq(rates.userId, userId), eq(rates.isPublic, true)));
  }

  async findRateById(id: string): Promise<Rate | undefined> {
    const [row] = await this.db.select().from(rates).where(eq(rates.id, id)).limit(1);
    return row;
  }

  async addRate(data: NewRate): Promise<Rate> {
    const [row] = await this.db.insert(rates).values(data).returning();
    return row;
  }

  async deleteRate(id: string): Promise<void> {
    await this.db.delete(rates).where(eq(rates.id, id));
  }

  // ----- past clients -----
  async findPastClientsByUserId(userId: string): Promise<PastClient[]> {
    return this.db.select().from(pastClients).where(eq(pastClients.userId, userId));
  }

  async findPastClientById(id: string): Promise<PastClient | undefined> {
    const [row] = await this.db
      .select()
      .from(pastClients)
      .where(eq(pastClients.id, id))
      .limit(1);
    return row;
  }

  async addPastClient(data: NewPastClient): Promise<PastClient> {
    const [row] = await this.db.insert(pastClients).values(data).returning();
    return row;
  }

  async deletePastClient(id: string): Promise<void> {
    await this.db.delete(pastClients).where(eq(pastClients.id, id));
  }
}
