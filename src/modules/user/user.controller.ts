import type { FastifyReply, FastifyRequest } from 'fastify';
import { HTTP } from '../../config/constants.js';
import { UnauthorizedError } from '../../utils/errors.js';
import type { UserService } from './user.service.js';
import type {
  GoogleAuthBody,
  LoginBody,
  Msg91VerifyBody,
  OtpRequestBody,
  OtpVerifyBody,
  RegisterBody,
  SetHandleBody,
  SetTagsBody,
  UpdateMeBody,
} from './user.types.js';

export class UserController {
  constructor(private readonly service: UserService) {}

  register = async (req: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply): Promise<void> => {
    const result = await this.service.register(req.body, {
      device: req.headers['user-agent'],
      ip: req.ip,
    });
    reply.status(HTTP.CREATED).send(result);
  };

  login = async (req: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply): Promise<void> => {
    const result = await this.service.login(req.body, {
      device: req.headers['user-agent'],
      ip: req.ip,
    });
    reply.send(result);
  };

  logout = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (req.sessionId) await this.service.logout(req.sessionId);
    reply.status(HTTP.NO_CONTENT).send();
  };

  requestOtp = async (req: FastifyRequest<{ Body: OtpRequestBody }>, reply: FastifyReply): Promise<void> => {
    const result = await this.service.requestOtp(req.body);
    reply.send(result);
  };

  verifyOtp = async (req: FastifyRequest<{ Body: OtpVerifyBody }>, reply: FastifyReply): Promise<void> => {
    const result = await this.service.verifyOtp(req.body, {
      device: req.headers['user-agent'],
      ip: req.ip,
    });
    reply.send(result);
  };

  googleAuth = async (req: FastifyRequest<{ Body: GoogleAuthBody }>, reply: FastifyReply): Promise<void> => {
    const result = await this.service.googleAuth(req.body.idToken, {
      device: req.headers['user-agent'],
      ip: req.ip,
    });
    reply.send(result);
  };

  verifyOtpToken = async (
    req: FastifyRequest<{ Body: Msg91VerifyBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const result = await this.service.verifyMsg91Token(req.body.accessToken, {
      device: req.headers['user-agent'],
      ip: req.ip,
    });
    reply.send(result);
  };

  setHandle = async (req: FastifyRequest<{ Body: SetHandleBody }>, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const user = await this.service.setHandle(req.user.id, req.body.username);
    reply.send(user);
  };

  me = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    reply.send({ ...req.user, onboardingComplete: this.service.isOnboardingComplete(req.user) });
  };

  updateMe = async (req: FastifyRequest<{ Body: UpdateMeBody }>, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const user = await this.service.updateProfile(req.user.id, req.body);
    reply.send(user);
  };

  getByUsername = async (
    req: FastifyRequest<{ Params: { username: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const user = await this.service.getByUsername(req.params.username);
    reply.send(user);
  };

  checkUsername = async (
    req: FastifyRequest<{ Querystring: { username: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const available = await this.service.isUsernameAvailable(req.query.username);
    reply.send({ username: req.query.username, available });
  };

  listNiches = async (_req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.send({ data: await this.service.listNiches() });
  };

  listSkills = async (_req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.send({ data: await this.service.listSkills() });
  };

  setNiches = async (req: FastifyRequest<{ Body: SetTagsBody }>, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.setNiches(req.user.id, req.body.ids);
    reply.status(HTTP.NO_CONTENT).send();
  };

  setSkills = async (req: FastifyRequest<{ Body: SetTagsBody }>, reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.setSkills(req.user.id, req.body.ids);
    reply.status(HTTP.NO_CONTENT).send();
  };
}
