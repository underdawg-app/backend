import { randomInt } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { splitPhone } from '../../utils/phone.js';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../../utils/errors.js';
import { hashPassword, verifyPassword, generateToken, hashToken } from '../../utils/crypto.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import type { UserRepository } from './user.repository.js';
import type {
  AuthResult,
  LoginBody,
  OtpRequestBody,
  OtpVerifyBody,
  OtpVerifyResult,
  RegisterBody,
  UpdateMeBody,
  User,
} from './user.types.js';

interface SessionContext {
  device?: string | undefined;
  ip?: string | undefined;
}

const OTP_MAX_ATTEMPTS = 5;
const COMPLETION_SIGNALS = 8;

/** Fraction of profile signals filled, as a 0–100 integer. */
export function computeProfileCompletion(
  user: Pick<
    User,
    'username' | 'displayName' | 'bio' | 'photoUrl' | 'creatorType' | 'locationCity' | 'locationCountry'
  >,
  counts: { niches: number; portfolioPieces: number },
): number {
  const signals = [
    Boolean(user.username),
    Boolean(user.displayName),
    Boolean(user.bio),
    Boolean(user.photoUrl),
    Boolean(user.creatorType),
    Boolean(user.locationCity ?? user.locationCountry),
    counts.niches > 0,
    counts.portfolioPieces > 0,
  ];
  return Math.round((signals.filter(Boolean).length / COMPLETION_SIGNALS) * 100);
}

export class UserService {
  /** Verifies Google ID tokens. Audience-checked against GOOGLE_CLIENT_ID at call time. */
  private readonly googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

  constructor(private readonly repo: UserRepository) {}

  async register(input: RegisterBody, ctx: SessionContext): Promise<AuthResult> {
    if (await this.repo.findByEmail(input.email)) {
      throw new ConflictError(`Email ${input.email} already in use`);
    }
    if (await this.repo.findByUsername(input.username)) {
      throw new ConflictError(`Username ${input.username} already taken`);
    }

    const user = await this.repo.create({
      email: input.email,
      username: input.username,
      displayName: input.displayName ?? input.username,
      role: input.role,
    });

    await this.repo.createCredential({
      userId: user.id,
      provider: 'email',
      passwordHash: await hashPassword(input.password),
    });

    const token = await this.issueSession(user.id, ctx);
    return { user, token };
  }

  async login(input: LoginBody, ctx: SessionContext): Promise<AuthResult> {
    const user = await this.repo.findByEmail(input.email);
    if (!user) throw new UnauthorizedError('Invalid credentials');

    const cred = await this.repo.findEmailCredential(user.id);
    if (!cred?.passwordHash || !(await verifyPassword(input.password, cred.passwordHash))) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = await this.issueSession(user.id, ctx);
    return { user, token };
  }

  async logout(sessionId: string): Promise<void> {
    await this.repo.revokeSession(sessionId);
  }

  // ----- phone OTP -----
  async requestOtp(input: OtpRequestBody): Promise<{ sent: boolean }> {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const existing = await this.repo.findByPhone(input.phone);
    await this.repo.createOtp({
      phone: input.phone,
      codeHash: hashToken(code),
      purpose: existing ? 'login' : 'signup',
      expiresAt: new Date(Date.now() + env.OTP_TTL_SECONDS * 1000),
    });

    if (env.OTP_DEV_PRINT) {
      logger.info({ phone: input.phone, code }, 'OTP code (dev only — not sent via SMS)');
    }
    // Production path: dispatch `code` via MSG91 here.
    return { sent: true };
  }

  async verifyOtp(input: OtpVerifyBody, ctx: SessionContext): Promise<OtpVerifyResult> {
    const otp = await this.repo.findActiveOtp(input.phone);
    if (!otp) throw new BadRequestError('No active code — request a new one');
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestError('Too many attempts — request a new code');
    }
    if (otp.codeHash !== hashToken(input.code)) {
      await this.repo.incrementOtpAttempts(otp.id);
      throw new UnauthorizedError('Invalid code');
    }
    await this.repo.consumeOtp(otp.id);

    let user = await this.repo.findByPhone(input.phone);
    if (!user) {
      user = await this.repo.create({ phone: input.phone, role: 'creator' });
      await this.repo.createCredential({
        userId: user.id,
        provider: 'phone',
        providerUid: input.phone,
      });
    }

    const token = await this.issueSession(user.id, ctx);
    return { user, token, onboardingComplete: this.isOnboardingComplete(user) };
  }

  // ----- Google (Sign in with Google) -----
  /**
   * Verify a Google ID token (minted on-device by the One-Tap flow), then
   * find-or-create the user and issue a session. Linking precedence:
   *   1. existing `google` credential (provider_uid = Google `sub`)
   *   2. existing user with the same verified email (links Google to that account)
   *   3. brand-new user
   */
  async googleAuth(idToken: string, ctx: SessionContext): Promise<OtpVerifyResult> {
    if (!env.GOOGLE_CLIENT_ID) throw new BadRequestError('Google login is not configured');

    const payload = await this.googleClient
      .verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID })
      .then((ticket) => ticket.getPayload())
      .catch(() => undefined);
    if (!payload?.sub) throw new UnauthorizedError('Invalid Google token');

    const cred = await this.repo.findByProviderUid('google', payload.sub);
    let user = cred ? await this.repo.findById(cred.userId) : undefined;

    if (!user && payload.email && payload.email_verified) {
      user = await this.repo.findByEmail(payload.email);
    }
    if (!user) {
      user = await this.repo.create({
        email: payload.email ?? null,
        displayName: payload.name ?? null,
        photoUrl: payload.picture ?? null,
        role: 'creator',
      });
    }
    if (!cred) {
      await this.repo.createCredential({
        userId: user.id,
        provider: 'google',
        providerUid: payload.sub,
      });
    }

    const token = await this.issueSession(user.id, ctx);
    return { user, token, onboardingComplete: this.isOnboardingComplete(user) };
  }

  /**
   * The MSG91 widget verifies the OTP client-side and returns a JWT access
   * token. We re-verify it server-side against MSG91 — the verified phone is
   * returned in the response (`message`) and is NEVER trusted from the client —
   * then find-or-create the user and issue a session.
   */
  async verifyMsg91Token(accessToken: string, ctx: SessionContext): Promise<OtpVerifyResult> {
    if (!env.MSG91_AUTH_KEY) throw new BadRequestError('MSG91 verification not configured');

    let data: { type?: string; message?: string };
    try {
      const res = await fetch('https://control.msg91.com/api/v5/widget/verifyAccessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authkey: env.MSG91_AUTH_KEY },
        body: JSON.stringify({ 'access-token': accessToken }),
      });
      data = (await res.json()) as { type?: string; message?: string };
    } catch (err) {
      logger.error({ err }, 'MSG91 verifyAccessToken request failed');
      throw new UnauthorizedError('Could not verify OTP token');
    }

    if (data.type !== 'success' || !data.message) {
      throw new UnauthorizedError('Invalid OTP token');
    }
    // Canonicalise to national (last 10 digits); keep the dial code separately.
    const { national, countryCode } = splitPhone(String(data.message));

    let user = await this.repo.findByPhone(national);
    if (!user) {
      user = await this.repo.create({ phone: national, phoneCountryCode: countryCode, role: 'creator' });
      await this.repo.createCredential({ userId: user.id, provider: 'phone', providerUid: national });
    }

    const token = await this.issueSession(user.id, ctx);
    return { user, token, onboardingComplete: this.isOnboardingComplete(user) };
  }

  async getById(id: string): Promise<User> {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async getByUsername(username: string): Promise<User> {
    const user = await this.repo.findByUsername(username);
    if (!user) throw new NotFoundError(`User @${username} not found`);
    return user;
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    return !(await this.repo.findByUsername(username));
  }

  async updateProfile(id: string, input: UpdateMeBody): Promise<User> {
    const updated = await this.repo.update(id, input);
    if (!updated) throw new NotFoundError('User not found');
    return this.recomputeCompletion(updated);
  }

  async setHandle(userId: string, username: string): Promise<User> {
    const existing = await this.repo.findByUsername(username);
    if (existing && existing.id !== userId) {
      throw new ConflictError(`Username ${username} already taken`);
    }
    const updated = await this.repo.update(userId, { username });
    if (!updated) throw new NotFoundError('User not found');
    return this.recomputeCompletion(updated);
  }

  listNiches() {
    return this.repo.listNiches();
  }

  listSkills() {
    return this.repo.listSkills();
  }

  async setNiches(userId: string, ids: string[]): Promise<void> {
    if ((await this.repo.nichesExist(ids)) !== ids.length) {
      throw new BadRequestError('One or more niche ids are invalid');
    }
    await this.repo.setUserNiches(userId, ids);
    const user = await this.repo.findById(userId);
    if (user) await this.recomputeCompletion(user);
  }

  async setSkills(userId: string, ids: string[]): Promise<void> {
    if ((await this.repo.skillsExist(ids)) !== ids.length) {
      throw new BadRequestError('One or more skill ids are invalid');
    }
    await this.repo.setUserSkills(userId, ids);
  }

  isOnboardingComplete(user: User): boolean {
    return Boolean(user.username && user.role && user.creatorType && user.displayName);
  }

  /** Recompute profileCompletionPct from current signals; persist only on change. */
  private async recomputeCompletion(user: User): Promise<User> {
    const [niches, portfolioPieces] = await Promise.all([
      this.repo.countUserNiches(user.id),
      this.repo.countPortfolioPieces(user.id),
    ]);
    const pct = computeProfileCompletion(user, { niches, portfolioPieces });
    if (pct === user.profileCompletionPct) return user;
    const updated = await this.repo.update(user.id, { profileCompletionPct: pct });
    return updated ?? user;
  }

  private async issueSession(userId: string, ctx: SessionContext): Promise<string> {
    const token = generateToken();
    await this.repo.createSession({
      userId,
      refreshTokenHash: hashToken(token),
      device: ctx.device ?? null,
      ip: ctx.ip ?? null,
    });
    return token;
  }
}
