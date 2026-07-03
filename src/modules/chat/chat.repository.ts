import { and, eq, inArray, isNull, gt, desc, ilike, or, sql } from 'drizzle-orm';
import type { DB } from '../../db/client.js';
import {
  users,
  follows,
  conversations,
  conversationParticipants,
  notes,
  type Conversation,
  type NewConversation,
  type ConversationParticipant,
  type Note,
  type NewNote,
} from '../../schema/index.js';
import type { ConversationTab, NoteView, RequestState } from './chat.types.js';

interface MemberSeed {
  userId: string;
  role: string;
  requestState: RequestState;
}

/** Full participant row joined with the user's display fields. */
export interface ParticipantRow {
  conversationId: string;
  userId: string;
  role: string;
  requestState: RequestState;
  archivedAt: Date | null;
  mutedAt: Date | null;
  lastReadAt: Date | null;
  username: string | null;
  displayName: string | null;
  photoUrl: string | null;
}

// Sort key for the conversation list: most recent activity, falling back to
// creation time for conversations that have no messages yet.
const sortKey = sql`coalesce(${conversations.lastMessageAt}, ${conversations.createdAt})`;

export class ChatRepository {
  constructor(private readonly db: DB) {}

  // ----- conversations -----
  async createConversation(data: NewConversation, members: MemberSeed[]): Promise<Conversation> {
    return this.db.transaction(async (tx) => {
      const [conv] = await tx.insert(conversations).values(data).returning();
      await tx
        .insert(conversationParticipants)
        .values(members.map((m) => ({ conversationId: conv.id, ...m })));
      return conv;
    });
  }

  async findConversationById(id: string): Promise<Conversation | undefined> {
    const [row] = await this.db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    return row;
  }

  /** An existing 1:1 (non-group) conversation between exactly these two users. */
  async findDirectConversation(a: string, b: string): Promise<Conversation | undefined> {
    const [row] = await this.db
      .select({ conversation: conversations })
      .from(conversations)
      .innerJoin(
        conversationParticipants,
        eq(conversationParticipants.conversationId, conversations.id),
      )
      .where(and(eq(conversations.isGroup, false), inArray(conversationParticipants.userId, [a, b])))
      .groupBy(conversations.id)
      .having(sql`count(*) = 2`)
      .limit(1);
    return row?.conversation;
  }

  getParticipant(
    conversationId: string,
    userId: string,
  ): Promise<ConversationParticipant | undefined> {
    return this.db
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]);
  }

  async listConversationsForUser(
    userId: string,
    tab: ConversationTab,
    limit: number,
    cursor?: string,
  ): Promise<Conversation[]> {
    const conds = [
      eq(conversationParticipants.userId, userId),
      isNull(conversationParticipants.deletedAt),
    ];
    conds.push(
      tab === 'requests'
        ? eq(conversationParticipants.requestState, 'pending')
        : eq(conversationParticipants.requestState, 'accepted'),
    );
    if (tab === 'primary') conds.push(eq(conversations.category, 'primary'));
    if (tab === 'deal') conds.push(eq(conversations.category, 'deal'));
    if (tab === 'collab') conds.push(eq(conversations.category, 'collab'));
    if (cursor) conds.push(sql`${sortKey} < ${cursor}`);

    const rows = await this.db
      .select({ conversation: conversations })
      .from(conversationParticipants)
      .innerJoin(conversations, eq(conversations.id, conversationParticipants.conversationId))
      .where(and(...conds))
      .orderBy(desc(sortKey))
      .limit(limit);
    return rows.map((r) => r.conversation);
  }

  listParticipants(conversationIds: string[]): Promise<ParticipantRow[]> {
    if (conversationIds.length === 0) return Promise.resolve([]);
    return this.db
      .select({
        conversationId: conversationParticipants.conversationId,
        userId: conversationParticipants.userId,
        role: conversationParticipants.role,
        requestState: conversationParticipants.requestState,
        archivedAt: conversationParticipants.archivedAt,
        mutedAt: conversationParticipants.mutedAt,
        lastReadAt: conversationParticipants.lastReadAt,
        username: users.username,
        displayName: users.displayName,
        photoUrl: users.photoUrl,
      })
      .from(conversationParticipants)
      .innerJoin(users, eq(users.id, conversationParticipants.userId))
      .where(inArray(conversationParticipants.conversationId, conversationIds));
  }

  async addParticipant(conversationId: string, userId: string): Promise<void> {
    await this.db
      .insert(conversationParticipants)
      .values({ conversationId, userId, role: 'member', requestState: 'accepted' })
      .onConflictDoNothing();
  }

  async removeParticipant(conversationId: string, userId: string): Promise<void> {
    await this.db
      .delete(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId),
        ),
      );
  }

  async updateParticipant(
    conversationId: string,
    userId: string,
    patch: Partial<Pick<ConversationParticipant, 'requestState' | 'archivedAt' | 'deletedAt' | 'mutedAt' | 'lastReadAt'>>,
  ): Promise<void> {
    await this.db
      .update(conversationParticipants)
      .set(patch)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId),
        ),
      );
  }

  async touchConversation(id: string, preview: string, at: Date): Promise<void> {
    await this.db
      .update(conversations)
      .set({ lastMessagePreview: preview, lastMessageAt: at })
      .where(eq(conversations.id, id));
  }

  async searchConversations(userId: string, q: string): Promise<Conversation[]> {
    const like = `%${q}%`;
    const otherMatch = sql`exists (
      select 1 from ${conversationParticipants} cp
      join ${users} u on u.id = cp.user_id
      where cp.conversation_id = ${conversations.id}
        and cp.user_id <> ${userId}
        and (u.display_name ilike ${like} or u.username ilike ${like})
    )`;

    const rows = await this.db
      .select({ conversation: conversations })
      .from(conversationParticipants)
      .innerJoin(conversations, eq(conversations.id, conversationParticipants.conversationId))
      .where(
        and(
          eq(conversationParticipants.userId, userId),
          isNull(conversationParticipants.deletedAt),
          eq(conversationParticipants.requestState, 'accepted'),
          or(ilike(conversations.title, like), otherMatch),
        ),
      )
      .orderBy(desc(sortKey))
      .limit(30);
    return rows.map((r) => r.conversation);
  }

  /** Subset of `candidateIds` that follow `userId` (used to gate DM requests). */
  async followersAmong(userId: string, candidateIds: string[]): Promise<Set<string>> {
    if (candidateIds.length === 0) return new Set();
    const rows = await this.db
      .select({ id: follows.followerId })
      .from(follows)
      .where(and(eq(follows.followingId, userId), inArray(follows.followerId, candidateIds)));
    return new Set(rows.map((r) => r.id));
  }

  // ----- notes -----
  async createNote(data: NewNote): Promise<Note> {
    const [row] = await this.db.insert(notes).values(data).returning();
    return row;
  }

  async findNoteById(id: string): Promise<Note | undefined> {
    const [row] = await this.db.select().from(notes).where(eq(notes.id, id)).limit(1);
    return row;
  }

  async deleteNote(id: string): Promise<void> {
    await this.db.delete(notes).where(eq(notes.id, id));
  }

  /** Caller's own notes plus those of users they follow, all unexpired. */
  async listVisibleNotes(userId: string): Promise<NoteView[]> {
    const followingIds = this.db
      .select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));

    const rows = await this.db
      .select({
        id: notes.id,
        content: notes.content,
        expiresAt: notes.expiresAt,
        createdAt: notes.createdAt,
        userId: users.id,
        username: users.username,
        displayName: users.displayName,
        photoUrl: users.photoUrl,
      })
      .from(notes)
      .innerJoin(users, eq(users.id, notes.userId))
      .where(
        and(
          gt(notes.expiresAt, new Date()),
          or(eq(notes.userId, userId), inArray(notes.userId, followingIds)),
        ),
      )
      .orderBy(desc(notes.createdAt));

    return rows.map((r) => ({
      id: r.id,
      content: r.content,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
      user: { id: r.userId, username: r.username, displayName: r.displayName, photoUrl: r.photoUrl },
    }));
  }
}
