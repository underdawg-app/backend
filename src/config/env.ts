import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().url(),

  CORS_ORIGIN: z.string().default('*'),

  // ----- Cloudinary (media upload) -----
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // ----- OTP (phone auth) -----
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  OTP_DEV_PRINT: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),

  // ----- Google OAuth (Sign in with Google — verifies client ID token) -----
  // The WEB OAuth client ID from Google Cloud Console (Google Auth platform →
  // Clients). Same value the mobile app passes as `webClientId`; it is the
  // audience the ID token is verified against.
  GOOGLE_CLIENT_ID: z.string().optional(),

  // ----- Firebase (realtime chat bridge) -----
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_DB_URL: z.string().url().optional(),

  // ----- MSG91 (OTP provider — frontend-driven, backend verifies; later phase) -----
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_WIDGET_ID: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
export type Env = typeof env;

export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
