import type { z } from 'zod';
import type { User } from '../../schema/index.js';
import type {
  registerBodySchema,
  loginBodySchema,
  updateMeBodySchema,
  setTagsBodySchema,
  otpRequestBodySchema,
  otpVerifyBodySchema,
  setHandleBodySchema,
  googleAuthBodySchema,
  msg91VerifyBodySchema,
} from './user.validator.js';

export type { User, Niche, Skill } from '../../schema/index.js';

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type UpdateMeBody = z.infer<typeof updateMeBodySchema>;
export type SetTagsBody = z.infer<typeof setTagsBodySchema>;
export type OtpRequestBody = z.infer<typeof otpRequestBodySchema>;
export type OtpVerifyBody = z.infer<typeof otpVerifyBodySchema>;
export type SetHandleBody = z.infer<typeof setHandleBodySchema>;
export type GoogleAuthBody = z.infer<typeof googleAuthBodySchema>;
export type Msg91VerifyBody = z.infer<typeof msg91VerifyBodySchema>;

/** Public-safe user shape (no internal-only fields stripped here, but ready to extend). */
export type PublicUser = User;

export interface AuthResult {
  user: User;
  token: string;
}

export interface OtpVerifyResult extends AuthResult {
  /** True once the user has a handle, role and creator type set. */
  onboardingComplete: boolean;
}
