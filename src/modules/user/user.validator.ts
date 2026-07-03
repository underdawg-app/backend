import { z } from 'zod';

const username = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9_]+$/, 'lowercase letters, numbers and underscores only');

const creatorType = z.enum([
  'visual_artist',
  'musician',
  'video_creator',
  'writer',
  'performer',
  'educator',
  'podcaster',
  'streamer',
  'lifestyle',
  'multi_hyphenate',
]);

// E.164-style phone (optional leading +, 7–15 digits).
const phone = z.string().regex(/^\+?[1-9]\d{6,14}$/, 'invalid phone number');

// ---------- request bodies / params ----------
export const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  username,
  displayName: z.string().min(1).max(255).optional(),
  role: z.enum(['creator', 'brand', 'manager', 'fan']).default('creator'),
});

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateMeBodySchema = z
  .object({
    role: z.enum(['creator', 'brand', 'manager', 'fan']),
    displayName: z.string().min(1).max(255).nullable(),
    bio: z.string().max(300).nullable(),
    photoUrl: z.string().url().nullable(),
    coverUrl: z.string().url().nullable(),
    locationCity: z.string().max(120).nullable(),
    locationCountry: z.string().max(120).nullable(),
    creatorType: creatorType.nullable(),
    isPrivate: z.boolean(),
  })
  .partial();

export const setTagsBodySchema = z.object({
  ids: z.array(z.string().uuid()).max(50),
});

export const usernameParamSchema = z.object({ username });
export const checkUsernameQuerySchema = z.object({ username });

// ---------- phone OTP ----------
export const otpRequestBodySchema = z.object({ phone });
export const otpVerifyBodySchema = z.object({
  phone,
  code: z.string().regex(/^\d{6}$/, 'code must be 6 digits'),
});

// ---------- onboarding: handle ----------
export const setHandleBodySchema = z.object({ username });

// ---------- Google (Sign in with Google) ----------
export const googleAuthBodySchema = z.object({
  idToken: z.string().min(20),
});

// ---------- MSG91 (phone OTP — verify widget access token) ----------
export const msg91VerifyBodySchema = z.object({
  accessToken: z.string().min(20),
});

// ---------- response shapes ----------
export const userResponseSchema = z.object({
  id: z.string().uuid(),
  role: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  phoneCountryCode: z.string().nullable(),
  username: z.string().nullable(),
  displayName: z.string().nullable(),
  bio: z.string().nullable(),
  photoUrl: z.string().nullable(),
  coverUrl: z.string().nullable(),
  locationCity: z.string().nullable(),
  locationCountry: z.string().nullable(),
  creatorType: z.string().nullable(),
  profileCompletionPct: z.number(),
  isPrivate: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const authResponseSchema = z.object({
  user: userResponseSchema,
  token: z.string(),
});
