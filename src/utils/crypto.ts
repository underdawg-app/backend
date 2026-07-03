import { randomBytes, scrypt as _scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(_scrypt);
const KEY_LEN = 64;

/**
 * Hash a password with scrypt. Format: `<saltHex>:<hashHex>`.
 * No external deps — uses node:crypto.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scrypt(password, salt, KEY_LEN)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

/** Verify a password against a stored `<salt>:<hash>` string. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(':');
  if (!salt || !hashHex) return false;
  const derived = (await scrypt(password, salt, KEY_LEN)) as Buffer;
  const storedBuf = Buffer.from(hashHex, 'hex');
  if (storedBuf.length !== derived.length) return false;
  return timingSafeEqual(storedBuf, derived);
}

/** Generate an opaque session token (returned to client once). */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** SHA-256 hash of a token for at-rest storage / lookup. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
