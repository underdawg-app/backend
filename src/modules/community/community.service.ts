import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../utils/errors.js';
import type { CommunityRepository } from './community.repository.js';
import type {
  Community,
  CommunityMember,
  CommunityPost,
  CommunityEvent,
  EventRsvp,
  Poll,
  PollOption,
  PollVote,
  QnaQuestion,
  QnaAnswer,
  CreateCommunityBody,
  UpdateCommunityBody,
  AddPostBody,
  CreateEventBody,
  CreatePollBody,
  AskQuestionBody,
  PollWithOptions,
  CommunityWithMemberCount,
} from './community.types.js';

export class CommunityService {
  constructor(private readonly repo: CommunityRepository) {}

  // ----- communities -----
  async createCommunity(input: CreateCommunityBody, ownerId: string): Promise<Community> {
    const community = await this.repo.createCommunity({
      name: input.name,
      description: input.description ?? null,
      rules: input.rules ?? null,
      category: input.category ?? null,
      ownerId,
    });
    await this.repo.addMember(community.id, ownerId, 'admin', 'active');
    return community;
  }

  async listCommunities(category?: string): Promise<Community[]> {
    return this.repo.listCommunities(category);
  }

  async getCommunity(id: string): Promise<CommunityWithMemberCount> {
    const community = await this.repo.findCommunityById(id);
    if (!community) throw new NotFoundError('Community not found');
    const memberCount = await this.repo.countMembers(id);
    return { community, memberCount };
  }

  async updateCommunity(id: string, requesterId: string, input: UpdateCommunityBody): Promise<Community> {
    const community = await this.repo.findCommunityById(id);
    if (!community) throw new NotFoundError('Community not found');
    if (community.ownerId !== requesterId) throw new ForbiddenError('Only the owner can update this community');
    const updated = await this.repo.updateCommunity(id, input);
    if (!updated) throw new NotFoundError('Community not found');
    return updated;
  }

  async deleteCommunity(id: string, requesterId: string): Promise<void> {
    const community = await this.repo.findCommunityById(id);
    if (!community) throw new NotFoundError('Community not found');
    if (community.ownerId !== requesterId) throw new ForbiddenError('Only the owner can delete this community');
    await this.repo.deleteCommunity(id);
  }

  async joinCommunity(communityId: string, userId: string): Promise<CommunityMember> {
    const existing = await this.repo.findMember(communityId, userId);
    if (existing) return existing;
    const community = await this.repo.findCommunityById(communityId);
    if (!community) throw new NotFoundError('Community not found');
    return this.repo.addMember(communityId, userId, 'member', 'active');
  }

  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    const community = await this.repo.findCommunityById(communityId);
    if (!community) throw new NotFoundError('Community not found');
    await this.repo.removeMember(communityId, userId);
  }

  async listMembers(communityId: string): Promise<CommunityMember[]> {
    const community = await this.repo.findCommunityById(communityId);
    if (!community) throw new NotFoundError('Community not found');
    return this.repo.listMembers(communityId);
  }

  // ----- community posts -----
  async addPost(communityId: string, input: AddPostBody, addedBy: string): Promise<CommunityPost> {
    const community = await this.repo.findCommunityById(communityId);
    if (!community) throw new NotFoundError('Community not found');
    const member = await this.repo.findMember(communityId, addedBy);
    if (!member || member.status !== 'active') throw new ForbiddenError('You must be an active member to post');
    const existing = await this.repo.findCommunityPost(communityId, input.postId);
    if (existing) throw new ConflictError('Post already linked to this community');
    return this.repo.addPost({
      communityId,
      postId: input.postId,
      flag: input.flag,
      pinned: input.pinned,
      addedBy,
    });
  }

  async listCommunityPosts(communityId: string): Promise<CommunityPost[]> {
    const community = await this.repo.findCommunityById(communityId);
    if (!community) throw new NotFoundError('Community not found');
    return this.repo.listCommunityPosts(communityId);
  }

  // ----- events -----
  async createEvent(communityId: string, input: CreateEventBody, requesterId: string): Promise<CommunityEvent> {
    const community = await this.repo.findCommunityById(communityId);
    if (!community) throw new NotFoundError('Community not found');
    if (community.ownerId !== requesterId) throw new ForbiddenError('Only the owner can create events');
    return this.repo.createEvent({
      communityId,
      kind: input.kind ?? 'event',
      title: input.title,
      description: input.description ?? null,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      location: input.location ?? null,
      coverUrl: input.coverUrl ?? null,
    });
  }

  async listEvents(communityId: string): Promise<CommunityEvent[]> {
    const community = await this.repo.findCommunityById(communityId);
    if (!community) throw new NotFoundError('Community not found');
    return this.repo.listEvents(communityId);
  }

  async rsvpEvent(eventId: string, userId: string, status: 'going' | 'interested' | 'declined'): Promise<EventRsvp> {
    const event = await this.repo.findEventById(eventId);
    if (!event) throw new NotFoundError('Event not found');
    return this.repo.upsertRsvp(eventId, userId, status);
  }

  // ----- polls -----
  async createPoll(input: CreatePollBody, ownerId: string): Promise<{ poll: Poll; options: PollOption[] }> {
    return this.repo.createPollWithOptions(
      {
        ownerId,
        question: input.question,
        multiSelect: input.multiSelect ?? false,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        status: 'active',
      },
      input.options,
    );
  }

  async getPoll(id: string): Promise<PollWithOptions> {
    const poll = await this.repo.findPollById(id);
    if (!poll) throw new NotFoundError('Poll not found');
    const options = await this.repo.listPollOptions(id);
    const optionsWithCounts = await Promise.all(
      options.map(async (option) => {
        const voteCount = await this.repo.countVotesForOption(option.id);
        return { option, voteCount };
      }),
    );
    return { poll, options: optionsWithCounts };
  }

  async vote(pollId: string, optionId: string, voterId: string): Promise<PollVote> {
    const poll = await this.repo.findPollById(pollId);
    if (!poll) throw new NotFoundError('Poll not found');
    if (poll.status === 'closed') throw new BadRequestError('Poll is closed');
    if (poll.expiresAt && new Date() > poll.expiresAt) throw new BadRequestError('Poll has expired');

    const options = await this.repo.listPollOptions(pollId);
    const targetOption = options.find((o) => o.id === optionId);
    if (!targetOption) throw new BadRequestError('Option does not belong to this poll');

    if (!poll.multiSelect) {
      await this.repo.deletePriorVotes(pollId, voterId);
    }

    return this.repo.insertVote(pollId, optionId, voterId);
  }

  async closePoll(id: string, requesterId: string): Promise<Poll> {
    const poll = await this.repo.findPollById(id);
    if (!poll) throw new NotFoundError('Poll not found');
    if (poll.ownerId !== requesterId) throw new ForbiddenError('Only the poll owner can close it');
    const updated = await this.repo.closePoll(id);
    if (!updated) throw new NotFoundError('Poll not found');
    return updated;
  }

  // ----- q&a -----
  async askQuestion(targetUserId: string, input: AskQuestionBody, askerId: string): Promise<QnaQuestion> {
    return this.repo.createQuestion({
      targetUserId,
      askerId,
      body: input.body,
      isAnonymous: input.isAnonymous ?? false,
      status: 'pending',
    });
  }

  async listAnsweredQuestions(targetUserId: string): Promise<Array<{ question: QnaQuestion; answer: QnaAnswer | null }>> {
    return this.repo.listAnsweredQuestionsForUser(targetUserId);
  }

  async answerQuestion(questionId: string, responderId: string, body: string): Promise<{ question: QnaQuestion; answer: QnaAnswer }> {
    const question = await this.repo.findQuestionById(questionId);
    if (!question) throw new NotFoundError('Question not found');
    if (question.targetUserId !== responderId) throw new ForbiddenError('Only the question recipient can answer');
    if (question.status === 'answered') throw new ConflictError('Question already answered');
    return this.repo.createAnswerAndMarkAnswered(questionId, body);
  }
}
