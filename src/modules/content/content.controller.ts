import type { FastifyReply, FastifyRequest } from 'fastify';
import { HTTP } from '../../config/constants.js';
import { UnauthorizedError } from '../../utils/errors.js';
import type { ContentService } from './content.service.js';
import type {
  CreatePostBody,
  UpdatePostBody,
  CreateCommentBody,
  CreateTagBody,
  FeedQuery,
  ListCommentsQuery,
  ListTagsQuery,
  SharePostBody,
  PostIdParam,
  CommentIdParam,
  UserIdParam,
} from './content.types.js';

export class ContentController {
  constructor(private readonly service: ContentService) {}

  // ----- posts -----

  createPost = async (
    req: FastifyRequest<{ Body: CreatePostBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const result = await this.service.createPost(req.user.id, req.body);
    reply.status(HTTP.CREATED).send(result);
  };

  getPost = async (
    req: FastifyRequest<{ Params: PostIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const result = await this.service.getPost(req.params.id);
    reply.send(result);
  };

  updatePost = async (
    req: FastifyRequest<{ Params: PostIdParam; Body: UpdatePostBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const post = await this.service.updatePost(req.params.id, req.user.id, req.body);
    reply.send(post);
  };

  deletePost = async (
    req: FastifyRequest<{ Params: PostIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.deletePost(req.params.id, req.user.id);
    reply.status(HTTP.NO_CONTENT).send();
  };

  publishPost = async (
    req: FastifyRequest<{ Params: PostIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const post = await this.service.publishPost(req.params.id, req.user.id);
    reply.send(post);
  };

  // ----- feed -----

  getFeed = async (
    req: FastifyRequest<{ Querystring: FeedQuery }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const result = await this.service.getFeed(req.user.id, req.query);
    reply.send(result);
  };

  // ----- comments -----

  createComment = async (
    req: FastifyRequest<{ Params: PostIdParam; Body: CreateCommentBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const comment = await this.service.createComment(req.params.id, req.user.id, req.body);
    reply.status(HTTP.CREATED).send(comment);
  };

  listComments = async (
    req: FastifyRequest<{ Params: PostIdParam; Querystring: ListCommentsQuery }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const comments = await this.service.listComments(req.params.id, req.query);
    reply.send({ data: comments });
  };

  deleteComment = async (
    req: FastifyRequest<{ Params: CommentIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.deleteComment(req.params.id, req.user.id);
    reply.status(HTTP.NO_CONTENT).send();
  };

  // ----- likes -----

  likePost = async (
    req: FastifyRequest<{ Params: PostIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const reaction = await this.service.likePost(req.params.id, req.user.id);
    reply.send(reaction);
  };

  unlikePost = async (
    req: FastifyRequest<{ Params: PostIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.unlikePost(req.params.id, req.user.id);
    reply.status(HTTP.NO_CONTENT).send();
  };

  likeComment = async (
    req: FastifyRequest<{ Params: CommentIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const reaction = await this.service.likeComment(req.params.id, req.user.id);
    reply.send(reaction);
  };

  unlikeComment = async (
    req: FastifyRequest<{ Params: CommentIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.unlikeComment(req.params.id, req.user.id);
    reply.status(HTTP.NO_CONTENT).send();
  };

  // ----- saves -----

  savePost = async (
    req: FastifyRequest<{ Params: PostIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.savePost(req.params.id, req.user.id);
    reply.status(HTTP.NO_CONTENT).send();
  };

  unsavePost = async (
    req: FastifyRequest<{ Params: PostIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.unsavePost(req.params.id, req.user.id);
    reply.status(HTTP.NO_CONTENT).send();
  };

  getSavedPosts = async (_req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!_req.user) throw new UnauthorizedError();
    const posts = await this.service.getSavedPosts(_req.user.id);
    reply.send({ data: posts });
  };

  // ----- reshares -----

  resharePost = async (
    req: FastifyRequest<{ Params: PostIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const reshare = await this.service.resharePost(req.params.id, req.user.id);
    reply.status(HTTP.CREATED).send(reshare);
  };

  // ----- shares (send) -----

  sharePost = async (
    req: FastifyRequest<{ Params: PostIdParam; Body: SharePostBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const share = await this.service.sharePost(req.params.id, req.user.id, req.body);
    reply.status(HTTP.CREATED).send(share);
  };

  // ----- follows -----

  followUser = async (
    req: FastifyRequest<{ Params: UserIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.followUser(req.user.id, req.params.userId);
    reply.status(HTTP.NO_CONTENT).send();
  };

  unfollowUser = async (
    req: FastifyRequest<{ Params: UserIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    await this.service.unfollowUser(req.user.id, req.params.userId);
    reply.status(HTTP.NO_CONTENT).send();
  };

  getFollowers = async (
    req: FastifyRequest<{ Params: UserIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const result = await this.service.getFollowers(req.params.userId);
    reply.send(result);
  };

  getFollowing = async (
    req: FastifyRequest<{ Params: UserIdParam }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const result = await this.service.getFollowing(req.params.userId);
    reply.send(result);
  };

  // ----- tags -----

  listTags = async (
    req: FastifyRequest<{ Querystring: ListTagsQuery }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const tagList = await this.service.listTags(req.query);
    reply.send({ data: tagList });
  };

  createTag = async (
    req: FastifyRequest<{ Body: CreateTagBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const tag = await this.service.createTag(req.user.id, req.body);
    reply.status(HTTP.CREATED).send(tag);
  };
}
