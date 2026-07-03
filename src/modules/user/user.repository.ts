import { and, eq, gt, inArray, isNull, desc, sql } from 'drizzle-orm';
import type { DB } from '../../db/client.js';
import {
  users,
  authCredentials,
  sessions,
  otpCodes,
  niches,
  skills,
  userNiches,
  userSkills,
  portfolios,
  portfolioPieces,
  type User,
  type NewUser,
  type AuthCredential,
  type NewAuthCredential,
  type Session,
  type NewSession,
  type OtpCode,
  type NewOtpCode,
  type Niche,
  type Skill,
} from '../../schema/index.js';

export class UserRepository {
  constructor(private readonly db: DB) {}

  // ----- users -----
  async findById(id: string): Promise<User | undefined> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return row;
  }

  async findByUsername(username: string): Promise<User | undefined> {
    const [row] = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return row;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const [row] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return row;
  }

  async findByPhone(phone: string): Promise<User | undefined> {
    const [row] = await this.db.select().from(users).where(eq(users.phone, phone)).limit(1);
    return row;
  }

  async create(data: NewUser): Promise<User> {
    const [row] = await this.db.insert(users).values(data).returning();
    return row;
  }

  async update(id: string, data: Partial<NewUser>): Promise<User | undefined> {
    const [row] = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return row;
  }

  // ----- credentials -----
  async createCredential(data: NewAuthCredential): Promise<AuthCredential> {
    const [row] = await this.db.insert(authCredentials).values(data).returning();
    return row;
  }

  async findEmailCredential(userId: string): Promise<AuthCredential | undefined> {
    const [row] = await this.db
      .select()
      .from(authCredentials)
      .where(and(eq(authCredentials.userId, userId), eq(authCredentials.provider, 'email')))
      .limit(1);
    return row;
  }

  /** Look up an OAuth credential by provider + provider's stable user id (e.g. Google `sub`). */
  async findByProviderUid(
    provider: 'google' | 'apple',
    providerUid: string,
  ): Promise<AuthCredential | undefined> {
    const [row] = await this.db
      .select()
      .from(authCredentials)
      .where(and(eq(authCredentials.provider, provider), eq(authCredentials.providerUid, providerUid)))
      .limit(1);
    return row;
  }

  // ----- otp codes -----
  async createOtp(data: NewOtpCode): Promise<OtpCode> {
    const [row] = await this.db.insert(otpCodes).values(data).returning();
    return row;
  }

  /** Newest still-valid (unconsumed, unexpired) challenge for a phone. */
  async findActiveOtp(phone: string): Promise<OtpCode | undefined> {
    const [row] = await this.db
      .select()
      .from(otpCodes)
      .where(
        and(eq(otpCodes.phone, phone), isNull(otpCodes.consumedAt), gt(otpCodes.expiresAt, new Date())),
      )
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);
    return row;
  }

  async incrementOtpAttempts(id: string): Promise<void> {
    await this.db
      .update(otpCodes)
      .set({ attempts: sql`${otpCodes.attempts} + 1` })
      .where(eq(otpCodes.id, id));
  }

  async consumeOtp(id: string): Promise<void> {
    await this.db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, id));
  }

  // ----- sessions -----
  async createSession(data: NewSession): Promise<Session> {
    const [row] = await this.db.insert(sessions).values(data).returning();
    return row;
  }

  async revokeSession(id: string): Promise<void> {
    await this.db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, id));
  }

  // ----- niches / skills -----
  listNiches(): Promise<Niche[]> {
    return this.db.select().from(niches);
  }

  listSkills(): Promise<Skill[]> {
    return this.db.select().from(skills);
  }

  async setUserNiches(userId: string, nicheIds: string[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.delete(userNiches).where(eq(userNiches.userId, userId));
      if (nicheIds.length > 0) {
        await tx.insert(userNiches).values(nicheIds.map((nicheId) => ({ userId, nicheId })));
      }
    });
  }

  async setUserSkills(userId: string, skillIds: string[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.delete(userSkills).where(eq(userSkills.userId, userId));
      if (skillIds.length > 0) {
        await tx.insert(userSkills).values(skillIds.map((skillId) => ({ userId, skillId })));
      }
    });
  }

  async getUserNiches(userId: string): Promise<Niche[]> {
    const rows = await this.db
      .select({ niche: niches })
      .from(userNiches)
      .innerJoin(niches, eq(niches.id, userNiches.nicheId))
      .where(eq(userNiches.userId, userId));
    return rows.map((r) => r.niche);
  }

  async nichesExist(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const rows = await this.db.select({ id: niches.id }).from(niches).where(inArray(niches.id, ids));
    return rows.length;
  }

  async skillsExist(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const rows = await this.db.select({ id: skills.id }).from(skills).where(inArray(skills.id, ids));
    return rows.length;
  }

  // ----- profile-completion signals -----
  async countUserNiches(userId: string): Promise<number> {
    const rows = await this.db
      .select({ id: userNiches.nicheId })
      .from(userNiches)
      .where(eq(userNiches.userId, userId));
    return rows.length;
  }

  async countPortfolioPieces(userId: string): Promise<number> {
    const rows = await this.db
      .select({ id: portfolioPieces.id })
      .from(portfolioPieces)
      .innerJoin(portfolios, eq(portfolios.id, portfolioPieces.portfolioId))
      .where(eq(portfolios.userId, userId));
    return rows.length;
  }
}
