import { NotFoundError } from '../../utils/errors.js';
import type { User } from '../../schema/index.js';
import type { UserRepository } from '../user/user.repository.js';
import type { ContentRepository } from '../content/content.repository.js';
import type { PortfolioRepository } from '../portfolio/portfolio.repository.js';
import type { ReputationRepository } from '../reputation/reputation.repository.js';
import type { ProfileRepository } from './profile.repository.js';
import type { ProfileView } from './profile.types.js';

const TREND_DAYS = 12;
const MY_POSTS_LIMIT = 24;

export class ProfileService {
  constructor(
    private readonly repo: ProfileRepository,
    private readonly users: UserRepository,
    private readonly content: ContentRepository,
    private readonly portfolio: PortfolioRepository,
    private readonly reputation: ReputationRepository,
  ) {}

  async getMine(userId: string): Promise<ProfileView> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return this.compose(user, userId);
  }

  async getByUsername(callerId: string, username: string): Promise<ProfileView> {
    const user = await this.users.findByUsername(username);
    if (!user) throw new NotFoundError('User not found');
    return this.compose(user, callerId);
  }

  /** Assembles the profile screen for `user`, with caller-relative post flags. */
  private async compose(user: User, callerId: string): Promise<ProfileView> {
    const portfolio = await this.portfolio.findByUserId(user.id);

    const [
      followerCount,
      followingCount,
      reputation,
      engagement,
      profileViews,
      trend,
      community,
      pieces,
      openTo,
      rates,
      pastClients,
      postRows,
    ] = await Promise.all([
      this.repo.countFollowers(user.id),
      this.repo.countFollowing(user.id),
      this.reputation.findByUserId(user.id),
      this.repo.engagementCounts(user.id),
      this.repo.countProfileViews(user.id),
      this.repo.followerTrend(user.id, TREND_DAYS),
      this.repo.communityCounts(user.id),
      portfolio ? this.portfolio.findPiecesByPortfolioId(portfolio.id) : Promise.resolve([]),
      this.portfolio.findOpenToByUserId(user.id),
      this.portfolio.findPublicRatesByUserId(user.id),
      this.portfolio.findPastClientsByUserId(user.id),
      this.repo.listPublishedPostsByAuthor(user.id, MY_POSTS_LIMIT),
    ]);

    const engagementTotal = engagement.likes + engagement.comments + engagement.reshares;
    const engagementRate =
      Math.round((engagementTotal / Math.max(followerCount, 1)) * 10000) / 100;

    const myPosts = await this.content.enrichPosts(callerId, postRows);

    return {
      header: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
        coverUrl: user.coverUrl,
        bio: user.bio,
        creatorType: user.creatorType,
        locationCity: user.locationCity,
        locationCountry: user.locationCountry,
        followerCount,
        followingCount,
        profileCompletionPct: user.profileCompletionPct,
        earnings: { total: 0, currency: 'INR' },
        reputation: { score: reputation?.score ?? 0, tier: reputation?.tier ?? 'emerging' },
      },
      analytics: {
        reach: 0,
        engagement: engagementTotal,
        engagementRate,
        profileViews,
        trend,
      },
      portfolio: {
        pieces: pieces.length,
        views: 0,
        linkClicks: 0,
        openTo,
        rates,
        pastClients,
      },
      community,
      myPosts,
    };
  }
}
