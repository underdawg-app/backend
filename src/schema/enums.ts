import { pgEnum } from 'drizzle-orm/pg-core';

// ---------- Identity & Auth ----------
export const userRoleEnum = pgEnum('user_role', ['creator', 'brand', 'manager', 'fan']);

export const creatorTypeEnum = pgEnum('creator_type', [
  'visual_artist',
  'musician',
  'video_creator',
  'writer',
  'performer',
  'educator',
  'podcaster',
  'streamer',
  'lifestyle',
  'multi_hyphenate',
]);

export const authProviderEnum = pgEnum('auth_provider', ['email', 'google', 'apple', 'phone']);

export const otpPurposeEnum = pgEnum('otp_purpose', ['signup', 'login']);

// ---------- Media (uploads) ----------
export const uploadResourceTypeEnum = pgEnum('upload_resource_type', ['image', 'video', 'raw']);

// ---------- Chat (conversation metadata; messages live in Firebase) ----------
export const conversationCategoryEnum = pgEnum('conversation_category', [
  'primary',
  'deal',
  'collab',
]);

export const conversationRequestStateEnum = pgEnum('conversation_request_state', [
  'pending',
  'accepted',
]);

// ---------- Profile & Portfolio ----------
export const portfolioPieceTypeEnum = pgEnum('portfolio_piece_type', [
  'image',
  'video',
  'audio',
  'link',
  'pdf',
  'embed',
]);

export const pageVisibilityEnum = pgEnum('page_visibility', ['public', 'private', 'unlisted']);

export const openToTypeEnum = pgEnum('open_to_type', [
  'collaboration',
  'brand_deals',
  'commissions',
  'management',
]);

// ---------- External Platforms ----------
export const socialPlatformEnum = pgEnum('social_platform', [
  'instagram',
  'youtube',
  'tiktok',
  'twitter',
  'spotify',
  'soundcloud',
  'twitch',
  'linkedin',
  'pinterest',
  'behance',
  'dribbble',
]);

export const connectionStatusEnum = pgEnum('connection_status', [
  'connected',
  'disconnected',
  'error',
]);

// ---------- Content & Feed ----------
export const postVisibilityEnum = pgEnum('post_visibility', ['public', 'followers', 'private']);

export const postStatusEnum = pgEnum('post_status', [
  'draft',
  'scheduled',
  'published',
  'archived',
]);

export const mediaTypeEnum = pgEnum('media_type', ['image', 'video', 'audio']);

export const tagTypeEnum = pgEnum('tag_type', ['craft', 'hashtag', 'topic']);

export const reactionTargetEnum = pgEnum('reaction_target', ['post', 'comment']);

export const shareTargetEnum = pgEnum('share_target', ['dm', 'group']);

// ---------- Community ----------
export const communityMemberRoleEnum = pgEnum('community_member_role', ['member', 'admin']);

export const communityMemberStatusEnum = pgEnum('community_member_status', [
  'active',
  'requested',
  'banned',
]);

export const communityPostFlagEnum = pgEnum('community_post_flag', [
  'announcement',
  'showcase',
  'discussion',
  'question',
]);

export const communityEventKindEnum = pgEnum('community_event_kind', ['event', 'program']);

export const rsvpStatusEnum = pgEnum('rsvp_status', ['going', 'interested', 'declined']);

export const pollStatusEnum = pgEnum('poll_status', ['active', 'closed']);

export const qnaStatusEnum = pgEnum('qna_status', ['pending', 'answered', 'declined']);

export const challengeStatusEnum = pgEnum('challenge_status', [
  'draft',
  'active',
  'voting',
  'judging',
  'ended',
]);

export const challengeEntryStatusEnum = pgEnum('challenge_entry_status', [
  'submitted',
  'shortlisted',
  'winner',
  'disqualified',
]);

// ---------- Reputation & Verification ----------
export const reputationTierEnum = pgEnum('reputation_tier', [
  'emerging',
  'bronze',
  'silver',
  'gold',
  'platinum',
]);

export const identityVerificationStatusEnum = pgEnum('identity_verification_status', [
  'pending',
  'verified',
  'rejected',
]);

export const verificationApplicationStatusEnum = pgEnum('verification_application_status', [
  'pending',
  'approved',
  'rejected',
]);

// ---------- Notifications ----------
export const notificationChannelEnum = pgEnum('notification_channel', ['push', 'in_app', 'email']);

export const notificationFrequencyEnum = pgEnum('notification_frequency', ['realtime', 'digest']);

export const pushPlatformEnum = pgEnum('push_platform', ['ios', 'android', 'web']);

// ---------- Settings ----------
export const themeEnum = pgEnum('theme', ['light', 'dark', 'system']);

export const downloadQualityEnum = pgEnum('download_quality', ['auto', 'low', 'medium', 'high']);

export const privacyScopeEnum = pgEnum('privacy_scope', ['everyone', 'followers', 'none']);

// ---------- External Platforms (audience) ----------
export const audienceDimensionEnum = pgEnum('audience_dimension', ['age', 'gender', 'geo']);

// ---------- Merch ----------
export const merchProductTypeEnum = pgEnum('merch_product_type', [
  'tee',
  'hoodie',
  'cap',
  'mug',
  'tote',
  'poster',
  'sticker',
  'case',
]);

export const merchDesignFormatEnum = pgEnum('merch_design_format', ['png', 'jpg', 'svg', 'psd']);

export const merchListingStatusEnum = pgEnum('merch_listing_status', [
  'draft',
  'active',
  'archived',
]);

export const designJobStatusEnum = pgEnum('design_job_status', [
  'requested',
  'quoted',
  'in_progress',
  'delivered',
  'completed',
  'cancelled',
]);

export const sslStatusEnum = pgEnum('ssl_status', ['pending', 'active', 'failed']);

// ---------- Brands & Gigs ----------
export const campaignTierEnum = pgEnum('campaign_tier', ['spark', 'wave', 'storm', 'takeover']);

export const gigApplicationStatusEnum = pgEnum('gig_application_status', [
  'pending',
  'review',
  'shortlisted',
  'accepted',
  'rejected',
  'withdrawn',
]);

export const negotiationStatusEnum = pgEnum('negotiation_status', ['open', 'agreed', 'rejected']);

export const deliverableReviewStatusEnum = pgEnum('deliverable_review_status', [
  'pending',
  'changes_requested',
  'approved',
]);

// ---------- Finance ----------
export const transactionTypeEnum = pgEnum('transaction_type', [
  'income',
  'withdrawal',
  'fee',
  'refund',
]);

export const transactionSourceEnum = pgEnum('transaction_source', [
  'merch',
  'gig',
  'tip',
  'subscription',
]);

export const payoutStatusEnum = pgEnum('payout_status', ['processing', 'completed', 'failed']);

export const paymentMethodTypeEnum = pgEnum('payment_method_type', ['bank', 'upi', 'paypal']);

export const kycStatusEnum = pgEnum('kyc_status', ['pending', 'verified', 'rejected']);

export const feeStreamEnum = pgEnum('fee_stream', ['merch', 'gig', 'tip', 'subscription']);

// ---------- Collaboration ----------
export const collabStatusEnum = pgEnum('collab_status', ['open', 'closed']);

export const collabRequestStatusEnum = pgEnum('collab_request_status', [
  'pending',
  'accepted',
  'declined',
]);

export const collaborationStatusEnum = pgEnum('collaboration_status', [
  'active',
  'completed',
  'cancelled',
]);

// ---------- Subscriptions ----------
export const subscriptionAudienceEnum = pgEnum('subscription_audience', ['creator', 'brand']);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'cancelled',
  'expired',
  'past_due',
]);

// ---------- Trust & Safety ----------
export const adminRoleEnum = pgEnum('admin_role', ['superadmin', 'moderator', 'support']);

export const reportTargetTypeEnum = pgEnum('report_target_type', [
  'content',
  'user',
  'comment',
  'fraud',
]);

export const reportStatusEnum = pgEnum('report_status', [
  'open',
  'reviewing',
  'resolved',
  'dismissed',
]);

export const moderationActionTypeEnum = pgEnum('moderation_action_type', [
  'warn',
  'restrict',
  'ban',
  'remove',
]);

export const appealStatusEnum = pgEnum('appeal_status', ['pending', 'approved', 'denied']);

// ---------- Compliance ----------
export const disclosureTriggerEnum = pgEnum('disclosure_trigger', ['get_viral', 'brand_deal']);

export const dataRequestTypeEnum = pgEnum('data_request_type', ['export', 'delete']);

export const dataRequestStatusEnum = pgEnum('data_request_status', [
  'pending',
  'processing',
  'completed',
]);
