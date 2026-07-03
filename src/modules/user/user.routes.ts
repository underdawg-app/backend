import type { FastifyInstance } from 'fastify';
import { typedRouter } from '../../utils/route.js';
import { UserController } from './user.controller.js';
import { UserRepository } from './user.repository.js';
import { UserService } from './user.service.js';
import {
  registerBodySchema,
  loginBodySchema,
  updateMeBodySchema,
  setTagsBodySchema,
  usernameParamSchema,
  checkUsernameQuerySchema,
  otpRequestBodySchema,
  otpVerifyBodySchema,
  setHandleBodySchema,
  googleAuthBodySchema,
  msg91VerifyBodySchema,
} from './user.validator.js';

export async function userRoutes(app: FastifyInstance): Promise<void> {
  const controller = new UserController(new UserService(new UserRepository(app.db)));
  const router = typedRouter(app);

  // ----- auth -----
  router.post(
    '/auth/register',
    {
      schema: {
        tags: ['auth'],
        summary: 'Register with email + password',
        body: registerBodySchema,
      },
    },
    controller.register,
  );

  router.post(
    '/auth/login',
    {
      schema: {
        tags: ['auth'],
        summary: 'Login with email + password',
        body: loginBodySchema,
      },
    },
    controller.login,
  );

  router.post(
    '/auth/logout',
    { preHandler: [app.authenticate], schema: { tags: ['auth'], summary: 'Revoke current session' } },
    controller.logout,
  );

  router.post(
    '/auth/otp/request',
    {
      schema: {
        tags: ['auth'],
        summary: 'Request a phone OTP (dev: code is logged to the server console)',
        body: otpRequestBodySchema,
      },
    },
    controller.requestOtp,
  );

  router.post(
    '/auth/google',
    {
      schema: {
        tags: ['auth'],
        summary: 'Login/register with a Google ID token — find-or-create user, issue a session',
        body: googleAuthBodySchema,
      },
    },
    controller.googleAuth,
  );

  router.post(
    '/auth/otp/msg91',
    {
      schema: {
        tags: ['auth'],
        summary: 'Verify a MSG91 widget access token — find-or-create user and issue a session',
        body: msg91VerifyBodySchema,
      },
    },
    controller.verifyOtpToken,
  );

  router.post(
    '/auth/otp/verify',
    {
      schema: {
        tags: ['auth'],
        summary: 'Verify a phone OTP — find-or-create user and issue a session',
        body: otpVerifyBodySchema,
      },
    },
    controller.verifyOtp,
  );

  // ----- current user -----
  router.get(
    '/users/me',
    {
      preHandler: [app.authenticate],
      schema: { tags: ['users'], summary: 'Current user' },
    },
    controller.me,
  );

  router.patch(
    '/users/me',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['users'],
        summary: 'Update own profile',
        body: updateMeBodySchema,
      },
    },
    controller.updateMe,
  );

  router.patch(
    '/users/me/handle',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['users'],
        summary: 'Set username/handle during onboarding (one-time choice)',
        body: setHandleBodySchema,
      },
    },
    controller.setHandle,
  );

  router.put(
    '/users/me/niches',
    {
      preHandler: [app.authenticate],
      schema: { tags: ['users'], summary: 'Set own niches', body: setTagsBodySchema },
    },
    controller.setNiches,
  );

  router.put(
    '/users/me/skills',
    {
      preHandler: [app.authenticate],
      schema: { tags: ['users'], summary: 'Set own skills', body: setTagsBodySchema },
    },
    controller.setSkills,
  );

  // ----- public lookups -----
  router.get(
    '/users/check-username',
    {
      schema: {
        tags: ['users'],
        summary: 'Username availability',
        querystring: checkUsernameQuerySchema,
      },
    },
    controller.checkUsername,
  );

  router.get(
    '/users/:username',
    {
      schema: {
        tags: ['users'],
        summary: 'Public profile by username',
        params: usernameParamSchema,
      },
    },
    controller.getByUsername,
  );

  // ----- lookup tables -----
  router.get('/niches', { schema: { tags: ['users'], summary: 'List niches' } }, controller.listNiches);
  router.get('/skills', { schema: { tags: ['users'], summary: 'List skills' } }, controller.listSkills);
}
