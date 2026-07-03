import type { z } from 'zod';
import type { OpenTo, Rate, PastClient } from '../../schema/index.js';
import type { EnrichedPost } from '../content/content.types.js';
import type { profileUsernameParamSchema } from './profile.validator.js';

export type ProfileUsernameParam = z.infer<typeof profileUsernameParamSchema>;

export interface ProfileHeader {
  id: string;
  username: string | null;
  displayName: string | null;
  photoUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  creatorType: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  followerCount: number;
  followingCount: number;
  profileCompletionPct: number;
  /** Stubbed — finance/earnings ledger is a later phase. */
  earnings: { total: number; currency: string };
  reputation: { score: number; tier: string };
}

export interface FollowerTrendPoint {
  date: string;
  followers: number;
}

export interface ProfileAnalytics {
  /** Stubbed 0 — impression/reach data depends on platform ingestion not yet wired. */
  reach: number;
  /** Real: likes + comments + reshares across the user's published posts. */
  engagement: number;
  /** engagement / max(followerCount, 1), as a percentage rounded to 2dp. */
  engagementRate: number;
  profileViews: number;
  /** Up to 12 days of daily follower totals from connected platforms (empty if none). */
  trend: FollowerTrendPoint[];
}

export interface PortfolioSummary {
  pieces: number;
  /** Stubbed 0 — portfolio view/click counters are not tracked yet. */
  views: number;
  linkClicks: number;
  openTo: OpenTo[];
  rates: Rate[];
  pastClients: PastClient[];
}

export interface CommunitySummary {
  communitiesJoined: number;
  answeredQuestions: number;
}

export interface ProfileView {
  header: ProfileHeader;
  analytics: ProfileAnalytics;
  portfolio: PortfolioSummary;
  community: CommunitySummary;
  myPosts: EnrichedPost[];
}
