import { eq, and, desc, count } from 'drizzle-orm';
import type { DB } from '../../db/client.js';
import {
  communities,
  communityMembers,
  communityPosts,
  communityEvents,
  eventRsvps,
  polls,
  pollOptions,
  pollVotes,
  qnaQuestions,
  qnaAnswers,
  type Community,
  type NewCommunity,
  type CommunityMember,
  type CommunityPost,
  type CommunityEvent,
  type NewCommunityEvent,
  type EventRsvp,
  type Poll,
  type NewPoll,
  type PollOption,
  type PollVote,
  type QnaQuestion,
  type NewQnaQuestion,
  type QnaAnswer,
} from '../../schema/index.js';

export class CommunityRepository {
  constructor(private readonly db: DB) {}

  // ----- communities -----
  async createCommunity(data: NewCommunity): Promise<Community> {
    const [row] = await this.db.insert(communities).values(data).returning();
    return row;
  }

  async findCommunityById(id: string): Promise<Community | undefined> {
    const [row] = await this.db.select().from(communities).where(eq(communities.id, id)).limit(1);
    return row;
  }

  async listCommunities(category?: string): Promise<Community[]> {
    if (category) {
      return this.db.select().from(communities).where(eq(communities.category, category)).orderBy(desc(communities.createdAt));
    }
    return this.db.select().from(communities).orderBy(desc(communities.createdAt));
  }

  async updateCommunity(id: string, data: Partial<NewCommunity>): Promise<Community | undefined> {
    const [row] = await this.db.update(communities).set(data).where(eq(communities.id, id)).returning();
    return row;
  }

  async deleteCommunity(id: string): Promise<void> {
    await this.db.delete(communities).where(eq(communities.id, id));
  }

  async countMembers(communityId: string): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(communityMembers)
      .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.status, 'active')));
    return row?.value ?? 0;
  }

  // ----- community members -----
  async findMember(communityId: string, userId: string): Promise<CommunityMember | undefined> {
    const [row] = await this.db
      .select()
      .from(communityMembers)
      .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)))
      .limit(1);
    return row;
  }

  async addMember(communityId: string, userId: string, memberRole: 'member' | 'admin' = 'member', status: 'active' | 'requested' | 'banned' = 'active'): Promise<CommunityMember> {
    const [row] = await this.db
      .insert(communityMembers)
      .values({ communityId, userId, memberRole, status })
      .returning();
    return row;
  }

  async removeMember(communityId: string, userId: string): Promise<void> {
    await this.db
      .delete(communityMembers)
      .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));
  }

  async listMembers(communityId: string): Promise<CommunityMember[]> {
    return this.db
      .select()
      .from(communityMembers)
      .where(eq(communityMembers.communityId, communityId));
  }

  // ----- community posts -----
  async addPost(data: { communityId: string; postId: string; flag?: 'announcement' | 'showcase' | 'discussion' | 'question'; pinned?: boolean; addedBy: string }): Promise<CommunityPost> {
    const [row] = await this.db
      .insert(communityPosts)
      .values({
        communityId: data.communityId,
        postId: data.postId,
        flag: data.flag ?? 'discussion',
        pinned: data.pinned ?? false,
        addedBy: data.addedBy,
      })
      .returning();
    return row;
  }

  async findCommunityPost(communityId: string, postId: string): Promise<CommunityPost | undefined> {
    const [row] = await this.db
      .select()
      .from(communityPosts)
      .where(and(eq(communityPosts.communityId, communityId), eq(communityPosts.postId, postId)))
      .limit(1);
    return row;
  }

  async listCommunityPosts(communityId: string): Promise<CommunityPost[]> {
    return this.db
      .select()
      .from(communityPosts)
      .where(eq(communityPosts.communityId, communityId))
      .orderBy(desc(communityPosts.addedAt));
  }

  // ----- events -----
  async createEvent(data: NewCommunityEvent): Promise<CommunityEvent> {
    const [row] = await this.db.insert(communityEvents).values(data).returning();
    return row;
  }

  async findEventById(id: string): Promise<CommunityEvent | undefined> {
    const [row] = await this.db.select().from(communityEvents).where(eq(communityEvents.id, id)).limit(1);
    return row;
  }

  async listEvents(communityId: string): Promise<CommunityEvent[]> {
    return this.db
      .select()
      .from(communityEvents)
      .where(eq(communityEvents.communityId, communityId));
  }

  // ----- rsvps -----
  async upsertRsvp(eventId: string, userId: string, status: 'going' | 'interested' | 'declined'): Promise<EventRsvp> {
    const [row] = await this.db
      .insert(eventRsvps)
      .values({ eventId, userId, status })
      .onConflictDoUpdate({
        target: [eventRsvps.eventId, eventRsvps.userId],
        set: { status },
      })
      .returning();
    return row;
  }

  // ----- polls -----
  async createPollWithOptions(
    pollData: NewPoll,
    options: string[],
  ): Promise<{ poll: Poll; options: PollOption[] }> {
    return this.db.transaction(async (tx) => {
      const [poll] = await tx.insert(polls).values(pollData).returning();
      const optionRows = await tx
        .insert(pollOptions)
        .values(options.map((label, position) => ({ pollId: poll.id, label, position })))
        .returning();
      return { poll, options: optionRows };
    });
  }

  async findPollById(id: string): Promise<Poll | undefined> {
    const [row] = await this.db.select().from(polls).where(eq(polls.id, id)).limit(1);
    return row;
  }

  async listPollOptions(pollId: string): Promise<PollOption[]> {
    return this.db
      .select()
      .from(pollOptions)
      .where(eq(pollOptions.pollId, pollId))
      .orderBy(pollOptions.position);
  }

  async countVotesForOption(optionId: string): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(pollVotes)
      .where(eq(pollVotes.optionId, optionId));
    return row?.value ?? 0;
  }

  async findExistingVoteByVoter(pollId: string, voterId: string): Promise<PollVote | undefined> {
    const [row] = await this.db
      .select()
      .from(pollVotes)
      .where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.voterId, voterId)))
      .limit(1);
    return row;
  }

  async deletePriorVotes(pollId: string, voterId: string): Promise<void> {
    await this.db
      .delete(pollVotes)
      .where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.voterId, voterId)));
  }

  async insertVote(pollId: string, optionId: string, voterId: string): Promise<PollVote> {
    const [row] = await this.db
      .insert(pollVotes)
      .values({ pollId, optionId, voterId })
      .returning();
    return row;
  }

  async closePoll(id: string): Promise<Poll | undefined> {
    const [row] = await this.db
      .update(polls)
      .set({ status: 'closed' })
      .where(eq(polls.id, id))
      .returning();
    return row;
  }

  // ----- q&a -----
  async createQuestion(data: NewQnaQuestion): Promise<QnaQuestion> {
    const [row] = await this.db.insert(qnaQuestions).values(data).returning();
    return row;
  }

  async findQuestionById(id: string): Promise<QnaQuestion | undefined> {
    const [row] = await this.db.select().from(qnaQuestions).where(eq(qnaQuestions.id, id)).limit(1);
    return row;
  }

  async listAnsweredQuestionsForUser(targetUserId: string): Promise<Array<{ question: QnaQuestion; answer: QnaAnswer | null }>> {
    const rows = await this.db
      .select({ question: qnaQuestions, answer: qnaAnswers })
      .from(qnaQuestions)
      .leftJoin(qnaAnswers, eq(qnaAnswers.questionId, qnaQuestions.id))
      .where(and(eq(qnaQuestions.targetUserId, targetUserId), eq(qnaQuestions.status, 'answered')))
      .orderBy(desc(qnaQuestions.askedAt));
    return rows;
  }

  async createAnswer(questionId: string, body: string): Promise<QnaAnswer> {
    const [row] = await this.db
      .insert(qnaAnswers)
      .values({ questionId, body })
      .returning();
    return row;
  }

  async markQuestionAnswered(id: string): Promise<QnaQuestion | undefined> {
    const [row] = await this.db
      .update(qnaQuestions)
      .set({ status: 'answered' })
      .where(eq(qnaQuestions.id, id))
      .returning();
    return row;
  }

  async createAnswerAndMarkAnswered(questionId: string, body: string): Promise<{ answer: QnaAnswer; question: QnaQuestion }> {
    return this.db.transaction(async (tx) => {
      const [answer] = await tx.insert(qnaAnswers).values({ questionId, body }).returning();
      const [question] = await tx
        .update(qnaQuestions)
        .set({ status: 'answered' })
        .where(eq(qnaQuestions.id, questionId))
        .returning();
      return { answer, question };
    });
  }
}
