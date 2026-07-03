import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import type { FirebaseServices } from '../../plugins/firebase.js';
import type { ChatRepository, ParticipantRow } from './chat.repository.js';
import type {
  ActivityBody,
  Conversation,
  ConversationListResult,
  ConversationTab,
  ConversationView,
  CreateConversationBody,
  MyParticipantState,
  NoteView,
  ParticipantView,
  RequestState,
} from './chat.types.js';

const NOTE_DEFAULT_TTL_HOURS = 24;

/**
 * Thin wrapper over Firebase RTDB for the realtime bridge. Postgres stays
 * authoritative; these writes mirror membership/activity so security rules can
 * authorize reads and clients get realtime fan-out. All writes are best-effort
 * (logged, never fatal) since the relational state is the source of truth.
 */
class FirebaseChatBridge {
  constructor(private readonly fb: FirebaseServices | null) {}

  get enabled(): boolean {
    return this.fb !== null;
  }

  mintToken(uid: string): Promise<string> {
    if (!this.fb) throw new BadRequestError('Realtime chat is not configured');
    return this.fb.auth.createCustomToken(uid);
  }

  async addMembers(conversationId: string, userIds: string[]): Promise<void> {
    if (!this.fb) return;
    try {
      const updates: Record<string, unknown> = {};
      for (const uid of userIds) {
        updates[`/threads/${conversationId}/members/${uid}`] = true;
        updates[`/inbox/${uid}/${conversationId}/unreadCount`] = 0;
        updates[`/inbox/${uid}/${conversationId}/updatedAt`] = Date.now();
      }
      await this.fb.db.ref().update(updates);
    } catch (err) {
      logger.warn({ err, conversationId }, 'Firebase addMembers failed');
    }
  }

  async removeMember(conversationId: string, uid: string): Promise<void> {
    if (!this.fb) return;
    try {
      await this.fb.db.ref().update({
        [`/threads/${conversationId}/members/${uid}`]: null,
        [`/inbox/${uid}/${conversationId}`]: null,
      });
    } catch (err) {
      logger.warn({ err, conversationId, uid }, 'Firebase removeMember failed');
    }
  }

  async recordActivity(
    conversationId: string,
    senderId: string,
    preview: string,
    recipientIds: string[],
  ): Promise<void> {
    if (!this.fb) return;
    try {
      const now = Date.now();
      await this.fb.db.ref(`/threads/${conversationId}/meta`).update({
        lastMessage: preview,
        lastSenderId: senderId,
        updatedAt: now,
      });
      await Promise.all(
        recipientIds.map(async (uid) => {
          const inbox = this.fb!.db.ref(`/inbox/${uid}/${conversationId}`);
          await inbox.child('preview').set(preview);
          await inbox.child('updatedAt').set(now);
          await inbox.child('unreadCount').transaction((c: number | null) => (c ?? 0) + 1);
        }),
      );
    } catch (err) {
      logger.warn({ err, conversationId }, 'Firebase recordActivity failed');
    }
  }

  async clearUnread(conversationId: string, uid: string): Promise<void> {
    if (!this.fb) return;
    try {
      await this.fb.db.ref(`/inbox/${uid}/${conversationId}/unreadCount`).set(0);
    } catch (err) {
      logger.warn({ err, conversationId, uid }, 'Firebase clearUnread failed');
    }
  }
}

export class ChatService {
  private readonly bridge: FirebaseChatBridge;

  constructor(
    private readonly repo: ChatRepository,
    firebase: FirebaseServices | null,
  ) {
    this.bridge = new FirebaseChatBridge(firebase);
  }

  firebaseToken(userId: string): Promise<string> {
    return this.bridge.mintToken(userId);
  }

  // ----- conversations -----
  async createConversation(creatorId: string, input: CreateConversationBody): Promise<ConversationView> {
    const others = [...new Set(input.participantIds.filter((id) => id !== creatorId))];
    if (others.length === 0) throw new BadRequestError('Add at least one other participant');

    const isGroup = input.isGroup ?? others.length > 1;
    const category = input.category ?? 'primary';

    // Reuse an existing 1:1 thread rather than creating duplicates.
    if (!isGroup && others.length === 1 && category === 'primary' && !input.gigApplicationId && !input.collaborationId) {
      const existing = await this.repo.findDirectConversation(creatorId, others[0]);
      if (existing) return this.getConversation(creatorId, existing.id);
    }

    // A 1:1 lands in the recipient's REQUESTS tab unless they already follow the
    // creator; group members are auto-accepted.
    const followers = isGroup ? new Set<string>() : await this.repo.followersAmong(creatorId, others);
    const memberState = (uid: string): RequestState =>
      isGroup || followers.has(uid) ? 'accepted' : 'pending';

    const conv = await this.repo.createConversation(
      {
        category,
        isGroup,
        title: input.title ?? null,
        createdBy: creatorId,
        gigApplicationId: input.gigApplicationId ?? null,
        collaborationId: input.collaborationId ?? null,
      },
      [
        { userId: creatorId, role: 'admin', requestState: 'accepted' },
        ...others.map((uid) => ({ userId: uid, role: 'member', requestState: memberState(uid) })),
      ],
    );

    await this.bridge.addMembers(conv.id, [creatorId, ...others]);
    return this.getConversation(creatorId, conv.id);
  }

  async listConversations(
    userId: string,
    tab: ConversationTab,
    limit: number,
    cursor?: string,
  ): Promise<ConversationListResult> {
    const convs = await this.repo.listConversationsForUser(userId, tab, limit, cursor);
    const data = await this.enrich(userId, convs);
    const nextCursor =
      convs.length < limit
        ? null
        : (convs[convs.length - 1].lastMessageAt ?? convs[convs.length - 1].createdAt).toISOString();
    return { data, nextCursor };
  }

  async getConversation(userId: string, conversationId: string): Promise<ConversationView> {
    const conv = await this.requireConversation(conversationId);
    await this.requireParticipant(conversationId, userId);
    const [view] = await this.enrich(userId, [conv]);
    return view;
  }

  async addParticipant(callerId: string, conversationId: string, userId: string): Promise<void> {
    await this.requireConversation(conversationId);
    await this.requireParticipant(conversationId, callerId);
    await this.repo.addParticipant(conversationId, userId);
    await this.bridge.addMembers(conversationId, [userId]);
  }

  async removeParticipant(callerId: string, conversationId: string, userId: string): Promise<void> {
    await this.requireConversation(conversationId);
    const caller = await this.requireParticipant(conversationId, callerId);
    if (userId !== callerId && caller.role !== 'admin') {
      throw new ForbiddenError('Only an admin can remove other participants');
    }
    await this.repo.removeParticipant(conversationId, userId);
    await this.bridge.removeMember(conversationId, userId);
  }

  async markRead(userId: string, conversationId: string): Promise<void> {
    await this.requireParticipant(conversationId, userId);
    await this.repo.updateParticipant(conversationId, userId, { lastReadAt: new Date() });
    await this.bridge.clearUnread(conversationId, userId);
  }

  async setArchived(userId: string, conversationId: string, archived: boolean): Promise<void> {
    await this.requireParticipant(conversationId, userId);
    await this.repo.updateParticipant(conversationId, userId, {
      archivedAt: archived ? new Date() : null,
    });
  }

  async softDelete(userId: string, conversationId: string): Promise<void> {
    await this.requireParticipant(conversationId, userId);
    await this.repo.updateParticipant(conversationId, userId, { deletedAt: new Date() });
  }

  async accept(userId: string, conversationId: string): Promise<void> {
    await this.requireParticipant(conversationId, userId);
    await this.repo.updateParticipant(conversationId, userId, { requestState: 'accepted' });
  }

  async recordActivity(senderId: string, conversationId: string, input: ActivityBody): Promise<void> {
    await this.requireConversation(conversationId);
    await this.requireParticipant(conversationId, senderId);
    const at = new Date();
    await this.repo.touchConversation(conversationId, input.preview, at);

    const participants = await this.repo.listParticipants([conversationId]);
    const recipients = participants.map((p) => p.userId).filter((id) => id !== senderId);
    await this.bridge.recordActivity(conversationId, senderId, input.preview, recipients);
  }

  async search(userId: string, q: string): Promise<ConversationView[]> {
    const convs = await this.repo.searchConversations(userId, q);
    return this.enrich(userId, convs);
  }

  // ----- notes -----
  async createNote(userId: string, content: string, ttlHours?: number): Promise<NoteView> {
    const expiresAt = new Date(Date.now() + (ttlHours ?? NOTE_DEFAULT_TTL_HOURS) * 3600 * 1000);
    const note = await this.repo.createNote({ userId, content, expiresAt });
    return {
      id: note.id,
      content: note.content,
      expiresAt: note.expiresAt,
      createdAt: note.createdAt,
      user: { id: userId, username: null, displayName: null, photoUrl: null },
    };
  }

  listNotes(userId: string): Promise<NoteView[]> {
    return this.repo.listVisibleNotes(userId);
  }

  async deleteNote(userId: string, id: string): Promise<void> {
    const note = await this.repo.findNoteById(id);
    if (!note) throw new NotFoundError('Note not found');
    if (note.userId !== userId) throw new ForbiddenError('Not the note owner');
    await this.repo.deleteNote(id);
  }

  // ----- helpers -----
  private async requireConversation(id: string): Promise<Conversation> {
    const conv = await this.repo.findConversationById(id);
    if (!conv) throw new NotFoundError('Conversation not found');
    return conv;
  }

  private async requireParticipant(conversationId: string, userId: string): Promise<ParticipantRow> {
    const all = await this.repo.listParticipants([conversationId]);
    const me = all.find((p) => p.userId === userId);
    if (!me) throw new ForbiddenError('Not a participant of this conversation');
    return me;
  }

  private async enrich(callerId: string, convs: Conversation[]): Promise<ConversationView[]> {
    if (convs.length === 0) return [];
    const rows = await this.repo.listParticipants(convs.map((c) => c.id));

    const byConv = new Map<string, ParticipantView[]>();
    const myByConv = new Map<string, MyParticipantState>();
    for (const r of rows) {
      const view: ParticipantView = {
        userId: r.userId,
        role: r.role,
        requestState: r.requestState,
        username: r.username,
        displayName: r.displayName,
        photoUrl: r.photoUrl,
      };
      (byConv.get(r.conversationId) ?? byConv.set(r.conversationId, []).get(r.conversationId)!).push(view);
      if (r.userId === callerId) {
        myByConv.set(r.conversationId, {
          role: r.role,
          requestState: r.requestState,
          archivedAt: r.archivedAt,
          mutedAt: r.mutedAt,
          lastReadAt: r.lastReadAt,
        });
      }
    }

    return convs.map((conversation) => ({
      conversation,
      participants: byConv.get(conversation.id) ?? [],
      myState:
        myByConv.get(conversation.id) ??
        { role: 'member', requestState: 'accepted', archivedAt: null, mutedAt: null, lastReadAt: null },
    }));
  }
}
