import { NotFoundError, ForbiddenError } from '../../utils/errors.js';
import type { PortfolioRepository } from './portfolio.repository.js';
import type {
  Portfolio,
  PortfolioPiece,
  PublicPageConfig,
  OpenTo,
  Rate,
  PastClient,
  AddPieceBody,
  UpdatePieceBody,
  PublicConfigBody,
  OpenToBody,
  AddRateBody,
  AddPastClientBody,
  PortfolioWithPieces,
} from './portfolio.types.js';

export class PortfolioService {
  constructor(private readonly repo: PortfolioRepository) {}

  // ----- portfolios -----
  async getOrCreateMyPortfolio(userId: string): Promise<PortfolioWithPieces> {
    let portfolio = await this.repo.findByUserId(userId);
    if (!portfolio) {
      portfolio = await this.repo.create({ userId });
    }
    const pieces = await this.repo.findPiecesByPortfolioId(portfolio.id);
    return { portfolio, pieces };
  }

  async getPublicPortfolio(userId: string): Promise<PortfolioWithPieces> {
    const portfolio = await this.repo.findByUserId(userId);
    if (!portfolio) throw new NotFoundError('Portfolio not found');
    const pieces = await this.repo.findPiecesByPortfolioId(portfolio.id);
    return { portfolio, pieces };
  }

  // ----- pieces -----
  async addPiece(userId: string, input: AddPieceBody): Promise<PortfolioPiece> {
    let portfolio = await this.repo.findByUserId(userId);
    if (!portfolio) {
      portfolio = await this.repo.create({ userId });
    }
    return this.repo.addPiece({
      portfolioId: portfolio.id,
      title: input.title ?? null,
      note: input.note ?? null,
      type: input.type,
      fileUrl: input.fileUrl ?? null,
      embedUrl: input.embedUrl ?? null,
      position: input.position ?? 0,
    });
  }

  async updatePiece(userId: string, pieceId: string, input: UpdatePieceBody): Promise<PortfolioPiece> {
    await this.assertPieceOwner(userId, pieceId);
    const updated = await this.repo.updatePiece(pieceId, input);
    if (!updated) throw new NotFoundError('Piece not found');
    return updated;
  }

  async deletePiece(userId: string, pieceId: string): Promise<void> {
    await this.assertPieceOwner(userId, pieceId);
    await this.repo.deletePiece(pieceId);
  }

  private async assertPieceOwner(userId: string, pieceId: string): Promise<Portfolio> {
    const piece = await this.repo.findPieceById(pieceId);
    if (!piece) throw new NotFoundError('Piece not found');
    const portfolio = await this.repo.findById(piece.portfolioId);
    if (!portfolio) throw new NotFoundError('Portfolio not found');
    if (portfolio.userId !== userId) throw new ForbiddenError();
    return portfolio;
  }

  // ----- public page config -----
  async getOrCreatePublicConfig(userId: string): Promise<PublicPageConfig> {
    const existing = await this.repo.findPublicConfigByUserId(userId);
    if (existing) return existing;
    return this.repo.upsertPublicConfig({ userId });
  }

  async upsertPublicConfig(userId: string, input: PublicConfigBody): Promise<PublicPageConfig> {
    return this.repo.upsertPublicConfig({
      userId,
      ...(input.visibility !== undefined && { visibility: input.visibility }),
      ...(input.hideStats !== undefined && { hideStats: input.hideStats }),
      ...(input.hideRates !== undefined && { hideRates: input.hideRates }),
    });
  }

  // ----- open_to -----
  async listOpenTo(userId: string): Promise<OpenTo[]> {
    return this.repo.findOpenToByUserId(userId);
  }

  async replaceOpenTo(userId: string, input: OpenToBody): Promise<OpenTo[]> {
    return this.repo.replaceOpenTo(userId, input.items);
  }

  // ----- rates -----
  async listPublicRates(userId: string): Promise<Rate[]> {
    return this.repo.findPublicRatesByUserId(userId);
  }

  async addRate(userId: string, input: AddRateBody): Promise<Rate> {
    return this.repo.addRate({
      userId,
      service: input.service,
      amount: input.amount,
      currency: input.currency ?? 'INR',
      isPublic: input.isPublic ?? true,
    });
  }

  async deleteRate(userId: string, rateId: string): Promise<void> {
    const rate = await this.repo.findRateById(rateId);
    if (!rate) throw new NotFoundError('Rate not found');
    if (rate.userId !== userId) throw new ForbiddenError();
    await this.repo.deleteRate(rateId);
  }

  // ----- past clients -----
  async listPastClients(userId: string): Promise<PastClient[]> {
    return this.repo.findPastClientsByUserId(userId);
  }

  async addPastClient(userId: string, input: AddPastClientBody): Promise<PastClient> {
    return this.repo.addPastClient({
      userId,
      name: input.name,
      logoUrl: input.logoUrl ?? null,
    });
  }

  async deletePastClient(userId: string, clientId: string): Promise<void> {
    const client = await this.repo.findPastClientById(clientId);
    if (!client) throw new NotFoundError('Past client not found');
    if (client.userId !== userId) throw new ForbiddenError();
    await this.repo.deletePastClient(clientId);
  }
}
