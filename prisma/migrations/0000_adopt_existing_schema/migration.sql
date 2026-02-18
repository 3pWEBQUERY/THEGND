-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."BillingProvider" AS ENUM ('STRIPE', 'PADDLE', 'LEMONSQUEEZY');

-- CreateEnum
CREATE TYPE "public"."BlogCategory" AS ENUM ('AKTUELLES', 'INTERESSANT_HEISSES', 'VON_USER_FUER_USER');

-- CreateEnum
CREATE TYPE "public"."FeedbackReason" AS ENUM ('REPORT_AD', 'BUG', 'PRAISE', 'ADVERTISING', 'CUSTOMER_SERVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."FeedbackStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED');

-- CreateEnum
CREATE TYPE "public"."GamificationEventType" AS ENUM ('DAILY_LOGIN', 'FORUM_POST', 'FORUM_REPLY', 'FEED_POST', 'COMMENT_VERIFIED', 'REGULAR_USE', 'FORUM_THREAD', 'FORUM_THREAD_CLOSE', 'FORUM_THREAD_OPEN', 'BLOG_POST', 'BLOG_PUBLISH', 'BLOG_UPDATE_MAJOR');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."GroupPrivacy" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "public"."GroupRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "public"."JobCategory" AS ENUM ('ESCORT', 'CLEANING', 'SECURITY', 'HOUSEKEEPING');

-- CreateEnum
CREATE TYPE "public"."MarketingAssetStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."MarketingOrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."MarketingPlacementKey" AS ENUM ('HOME_BANNER', 'HOME_TILE', 'RESULTS_TOP', 'SIDEBAR', 'SPONSORED_POST', 'HOME_TOP', 'HOME_MID', 'HOME_BOTTOM');

-- CreateEnum
CREATE TYPE "public"."MatchActionType" AS ENUM ('LIKE', 'PASS');

-- CreateEnum
CREATE TYPE "public"."NotificationPreference" AS ENUM ('ALL', 'IMPORTANT', 'NONE');

-- CreateEnum
CREATE TYPE "public"."OnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "public"."ProfileView" AS ENUM ('STANDARD', 'ALT1', 'ALT2', 'FULL_SIDE');

-- CreateEnum
CREATE TYPE "public"."ProfileVisibility" AS ENUM ('PUBLIC', 'VERIFIED', 'PRIVATE');

-- CreateEnum
CREATE TYPE "public"."RentalCategory" AS ENUM ('APARTMENT', 'ROOM', 'STUDIO', 'EVENT_SPACE');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'UNPAID');

-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('MEMBER', 'ESCORT', 'AGENCY', 'CLUB', 'STUDIO');

-- CreateEnum
CREATE TYPE "public"."VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."addon_key" AS ENUM ('ESCORT_OF_DAY', 'ESCORT_OF_WEEK', 'ESCORT_OF_MONTH', 'CITY_BOOST', 'PROFILE_ANALYTICS', 'COUNTRY_BLOCK', 'SEO');

-- CreateEnum
CREATE TYPE "public"."booking_status" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."date_request_status" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."membership_plan_key" AS ENUM ('BASIS', 'PLUS', 'PREMIUM');

-- CreateEnum
CREATE TYPE "public"."membership_status" AS ENUM ('ACTIVE', 'CANCELED', 'PAUSED', 'EXPIRED');

-- CreateTable
CREATE TABLE "public"."addon_options" (
    "id" TEXT NOT NULL,
    "addonId" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addon_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."addons" (
    "id" TEXT NOT NULL,
    "key" "public"."addon_key" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."app_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "public"."badges" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "pointsReward" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_customers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "public"."BillingProvider" NOT NULL,
    "providerCustomerId" TEXT NOT NULL,
    "defaultPaymentMethodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_invoices" (
    "id" TEXT NOT NULL,
    "billingCustomerId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "providerInvoiceId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "hostedInvoiceUrl" TEXT,
    "pdf" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_payment_methods" (
    "id" TEXT NOT NULL,
    "billingCustomerId" TEXT NOT NULL,
    "providerPaymentMethodId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "expMonth" INTEGER NOT NULL,
    "expYear" INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_subscriptions" (
    "id" TEXT NOT NULL,
    "billingCustomerId" TEXT NOT NULL,
    "providerSubscriptionId" TEXT NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL,
    "planName" TEXT,
    "priceId" TEXT,
    "amount" INTEGER,
    "currency" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAt" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN DEFAULT false,
    "endedAt" TIMESTAMP(3),
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."blog_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT,
    "coverImage" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "category" "public"."BlogCategory" NOT NULL DEFAULT 'AKTUELLES',

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "postId" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentId" TEXT,
    "deletionRequestMessage" TEXT,
    "deletionRequested" BOOLEAN NOT NULL DEFAULT false,
    "editRequestMessage" TEXT,
    "editRequested" BOOLEAN NOT NULL DEFAULT false,
    "hiddenByOwner" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "targetUserId" TEXT,
    "rating" INTEGER,
    "reviewTicketId" TEXT,
    "verifiedByTicket" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."date_requests" (
    "id" TEXT NOT NULL,
    "escort_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER,
    "price_cents" INTEGER,
    "currency" TEXT,
    "extras" JSONB,
    "place_key" TEXT,
    "place_label" TEXT,
    "city" TEXT,
    "location" TEXT,
    "note" TEXT,
    "status" "public"."date_request_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "place_id" TEXT,
    "outfit_key" TEXT,
    "outfit_label" TEXT,

    CONSTRAINT "date_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feed_group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."GroupRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feed_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "privacy" "public"."GroupPrivacy" NOT NULL DEFAULT 'PUBLIC',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cover" TEXT,

    CONSTRAINT "feed_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "message" TEXT NOT NULL,
    "status" "public"."FeedbackStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contact" TEXT,
    "customTitle" TEXT,
    "reason" "public"."FeedbackReason",

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."follows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."forum_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."forum_post_reports" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "forum_post_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."forum_posts" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."forum_threads" (
    "id" TEXT NOT NULL,
    "forumId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "lastPostAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."forums" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "icon" TEXT,
    "image" TEXT,

    CONSTRAINT "forums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."gamification_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."GamificationEventType" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gamification_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."gamification_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "totalLogins" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gamification_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jobs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDesc" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "public"."JobCategory" NOT NULL,
    "location" TEXT,
    "city" TEXT,
    "country" TEXT,
    "salaryInfo" TEXT,
    "contactInfo" TEXT,
    "media" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "postedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."marketing_assets" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "status" "public"."MarketingAssetStatus" NOT NULL DEFAULT 'PENDING',
    "targetUrl" TEXT,

    CONSTRAINT "marketing_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."marketing_order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "placementKey" "public"."MarketingPlacementKey" NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."marketing_orders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."MarketingOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."member_match_actions" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "escortId" TEXT NOT NULL,
    "action" "public"."MatchActionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_match_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."membership_plans" (
    "id" TEXT NOT NULL,
    "key" "public"."membership_plan_key" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "features" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."perks" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "thresholdPts" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."posts" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "images" TEXT,
    "authorId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "groupId" TEXT,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."profile_analytics_events" (
    "id" TEXT NOT NULL,
    "profileUserId" TEXT NOT NULL,
    "visitorId" TEXT,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "path" TEXT,
    "referrer" TEXT,
    "country" TEXT,
    "userAgent" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "device" TEXT,
    "durationMs" INTEGER,
    "meta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."profile_visits" (
    "id" TEXT NOT NULL,
    "profileUserId" TEXT NOT NULL,
    "visitorId" TEXT,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "bio" TEXT,
    "avatar" TEXT,
    "location" TEXT,
    "age" INTEGER,
    "gender" "public"."Gender",
    "preferences" TEXT,
    "slogan" TEXT,
    "nationality" TEXT,
    "languages" TEXT,
    "height" TEXT,
    "weight" TEXT,
    "bodyType" TEXT,
    "hairColor" TEXT,
    "eyeColor" TEXT,
    "description" TEXT,
    "services" TEXT,
    "gallery" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "zipCode" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "socialMedia" TEXT,
    "companyName" TEXT,
    "businessType" TEXT,
    "established" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "locationFormatted" TEXT,
    "locationPlaceId" TEXT,
    "longitude" DOUBLE PRECISION,
    "breastSize" TEXT,
    "breastType" TEXT,
    "clothingSize" TEXT,
    "clothingStyle" TEXT,
    "hairLength" TEXT,
    "intimateArea" TEXT,
    "media" TEXT,
    "piercings" TEXT,
    "shoeSize" TEXT,
    "tattoos" TEXT,
    "notificationPreference" "public"."NotificationPreference" NOT NULL DEFAULT 'ALL',
    "visibility" "public"."ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
    "openingHours" TEXT,
    "profileView" "public"."ProfileView" NOT NULL DEFAULT 'STANDARD',

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rentals" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDesc" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "public"."RentalCategory" NOT NULL,
    "location" TEXT,
    "city" TEXT,
    "country" TEXT,
    "priceInfo" TEXT,
    "contactInfo" TEXT,
    "media" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "postedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."review_tickets" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "redeemedById" TEXT,
    "redeemedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stories" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image" TEXT,
    "video" TEXT,
    "authorId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."story_views" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."thread_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "thread_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_addon_bookings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addonOptionId" TEXT NOT NULL,
    "status" "public"."booking_status" NOT NULL DEFAULT 'PENDING',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_addon_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_addon_states" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" "public"."addon_key" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "settings" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_addon_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "public"."membership_status" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "cancelAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_perks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "perkId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "user_perks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "userType" "public"."UserType" NOT NULL,
    "onboardingStatus" "public"."OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isModerator" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_requests" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "idNumber" TEXT NOT NULL,
    "idPhotoUrl" TEXT NOT NULL,
    "selfiePhotoUrl" TEXT NOT NULL,
    "idVideoUrl" TEXT,
    "status" "public"."VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "addon_options_addonId_durationDays_key" ON "public"."addon_options"("addonId" ASC, "durationDays" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "addons_key_key" ON "public"."addons"("key" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "badges_key_key" ON "public"."badges"("key" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "billing_customers_defaultPaymentMethodId_key" ON "public"."billing_customers"("defaultPaymentMethodId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "billing_customers_provider_providerCustomerId_key" ON "public"."billing_customers"("provider" ASC, "providerCustomerId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "billing_customers_userId_provider_key" ON "public"."billing_customers"("userId" ASC, "provider" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "billing_invoices_providerInvoiceId_key" ON "public"."billing_invoices"("providerInvoiceId" ASC);

-- CreateIndex
CREATE INDEX "billing_invoices_subscriptionId_idx" ON "public"."billing_invoices"("subscriptionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "billing_payment_methods_billingCustomerId_providerPaymentMe_key" ON "public"."billing_payment_methods"("billingCustomerId" ASC, "providerPaymentMethodId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "billing_subscriptions_providerSubscriptionId_key" ON "public"."billing_subscriptions"("providerSubscriptionId" ASC);

-- CreateIndex
CREATE INDEX "blog_posts_authorId_idx" ON "public"."blog_posts"("authorId" ASC);

-- CreateIndex
CREATE INDEX "blog_posts_published_publishedAt_idx" ON "public"."blog_posts"("published" ASC, "publishedAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "public"."blog_posts"("slug" ASC);

-- CreateIndex
CREATE INDEX "comments_postId_parentId_idx" ON "public"."comments"("postId" ASC, "parentId" ASC);

-- CreateIndex
CREATE INDEX "comments_targetUserId_idx" ON "public"."comments"("targetUserId" ASC);

-- CreateIndex
CREATE INDEX "idx_date_requests_escort" ON "public"."date_requests"("escort_id" ASC, "status" ASC, "starts_at" ASC);

-- CreateIndex
CREATE INDEX "idx_date_requests_member" ON "public"."date_requests"("member_id" ASC, "status" ASC, "starts_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "feed_group_members_groupId_userId_key" ON "public"."feed_group_members"("groupId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "feed_group_members_userId_idx" ON "public"."feed_group_members"("userId" ASC);

-- CreateIndex
CREATE INDEX "feed_groups_ownerId_idx" ON "public"."feed_groups"("ownerId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "feed_groups_slug_key" ON "public"."feed_groups"("slug" ASC);

-- CreateIndex
CREATE INDEX "feedback_reason_idx" ON "public"."feedback"("reason" ASC);

-- CreateIndex
CREATE INDEX "feedback_status_createdAt_idx" ON "public"."feedback"("status" ASC, "createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "follows_followerId_followingId_key" ON "public"."follows"("followerId" ASC, "followingId" ASC);

-- CreateIndex
CREATE INDEX "forum_post_reports_postId_status_idx" ON "public"."forum_post_reports"("postId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "forum_posts_threadId_parentId_createdAt_idx" ON "public"."forum_posts"("threadId" ASC, "parentId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "forum_threads_forumId_isPinned_lastPostAt_idx" ON "public"."forum_threads"("forumId" ASC, "isPinned" ASC, "lastPostAt" ASC);

-- CreateIndex
CREATE INDEX "forums_categoryId_parentId_idx" ON "public"."forums"("categoryId" ASC, "parentId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "forums_slug_key" ON "public"."forums"("slug" ASC);

-- CreateIndex
CREATE INDEX "gamification_events_userId_type_createdAt_idx" ON "public"."gamification_events"("userId" ASC, "type" ASC, "createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "gamification_profiles_userId_key" ON "public"."gamification_profiles"("userId" ASC);

-- CreateIndex
CREATE INDEX "jobs_category_createdAt_idx" ON "public"."jobs"("category" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "jobs_postedById_createdAt_idx" ON "public"."jobs"("postedById" ASC, "createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "likes_userId_postId_key" ON "public"."likes"("userId" ASC, "postId" ASC);

-- CreateIndex
CREATE INDEX "marketing_assets_orderItemId_idx" ON "public"."marketing_assets"("orderItemId" ASC);

-- CreateIndex
CREATE INDEX "marketing_order_items_orderId_placementKey_idx" ON "public"."marketing_order_items"("orderId" ASC, "placementKey" ASC);

-- CreateIndex
CREATE INDEX "marketing_orders_userId_status_idx" ON "public"."marketing_orders"("userId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "member_match_actions_escortId_idx" ON "public"."member_match_actions"("escortId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "member_match_actions_memberId_escortId_key" ON "public"."member_match_actions"("memberId" ASC, "escortId" ASC);

-- CreateIndex
CREATE INDEX "member_match_actions_memberId_idx" ON "public"."member_match_actions"("memberId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "membership_plans_key_key" ON "public"."membership_plans"("key" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "public"."password_reset_tokens"("token_hash" ASC);

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_expires_at_idx" ON "public"."password_reset_tokens"("user_id" ASC, "expires_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "perks_key_key" ON "public"."perks"("key" ASC);

-- CreateIndex
CREATE INDEX "profile_analytics_events_profileUserId_createdAt_idx" ON "public"."profile_analytics_events"("profileUserId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "profile_analytics_events_sessionId_type_idx" ON "public"."profile_analytics_events"("sessionId" ASC, "type" ASC);

-- CreateIndex
CREATE INDEX "profile_analytics_events_visitorId_createdAt_idx" ON "public"."profile_analytics_events"("visitorId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "profile_visits_profileUserId_visitedAt_idx" ON "public"."profile_visits"("profileUserId" ASC, "visitedAt" ASC);

-- CreateIndex
CREATE INDEX "profile_visits_visitorId_visitedAt_idx" ON "public"."profile_visits"("visitorId" ASC, "visitedAt" ASC);

-- CreateIndex
CREATE INDEX "profiles_latitude_longitude_idx" ON "public"."profiles"("latitude" ASC, "longitude" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "public"."profiles"("userId" ASC);

-- CreateIndex
CREATE INDEX "rentals_category_createdAt_idx" ON "public"."rentals"("category" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "rentals_postedById_createdAt_idx" ON "public"."rentals"("postedById" ASC, "createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "review_tickets_code_key" ON "public"."review_tickets"("code" ASC);

-- CreateIndex
CREATE INDEX "review_tickets_issuedById_idx" ON "public"."review_tickets"("issuedById" ASC);

-- CreateIndex
CREATE INDEX "review_tickets_redeemedById_idx" ON "public"."review_tickets"("redeemedById" ASC);

-- CreateIndex
CREATE INDEX "review_tickets_targetUserId_idx" ON "public"."review_tickets"("targetUserId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "story_views_storyId_userId_key" ON "public"."story_views"("storyId" ASC, "userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "thread_subscriptions_userId_threadId_key" ON "public"."thread_subscriptions"("userId" ASC, "threadId" ASC);

-- CreateIndex
CREATE INDEX "user_addon_bookings_userId_status_idx" ON "public"."user_addon_bookings"("userId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "user_addon_states_userId_key_idx" ON "public"."user_addon_states"("userId" ASC, "key" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "user_addon_states_userId_key_key" ON "public"."user_addon_states"("userId" ASC, "key" ASC);

-- CreateIndex
CREATE INDEX "user_badges_badgeId_idx" ON "public"."user_badges"("badgeId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_userId_badgeId_key" ON "public"."user_badges"("userId" ASC, "badgeId" ASC);

-- CreateIndex
CREATE INDEX "user_memberships_userId_status_idx" ON "public"."user_memberships"("userId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "user_perks_perkId_idx" ON "public"."user_perks"("perkId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "user_perks_userId_perkId_key" ON "public"."user_perks"("userId" ASC, "perkId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email" ASC);

-- CreateIndex
CREATE INDEX "verification_requests_userId_status_idx" ON "public"."verification_requests"("userId" ASC, "status" ASC);

-- AddForeignKey
ALTER TABLE "public"."addon_options" ADD CONSTRAINT "addon_options_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "public"."addons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_customers" ADD CONSTRAINT "billing_customers_defaultPaymentMethodId_fkey" FOREIGN KEY ("defaultPaymentMethodId") REFERENCES "public"."billing_payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_customers" ADD CONSTRAINT "billing_customers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_invoices" ADD CONSTRAINT "billing_invoices_billingCustomerId_fkey" FOREIGN KEY ("billingCustomerId") REFERENCES "public"."billing_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_invoices" ADD CONSTRAINT "billing_invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."billing_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_payment_methods" ADD CONSTRAINT "billing_payment_methods_billingCustomerId_fkey" FOREIGN KEY ("billingCustomerId") REFERENCES "public"."billing_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_billingCustomerId_fkey" FOREIGN KEY ("billingCustomerId") REFERENCES "public"."billing_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."blog_posts" ADD CONSTRAINT "blog_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_reviewTicketId_fkey" FOREIGN KEY ("reviewTicketId") REFERENCES "public"."review_tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."date_requests" ADD CONSTRAINT "date_requests_escort_id_fkey" FOREIGN KEY ("escort_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."date_requests" ADD CONSTRAINT "date_requests_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feed_group_members" ADD CONSTRAINT "feed_group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."feed_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feed_group_members" ADD CONSTRAINT "feed_group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feed_groups" ADD CONSTRAINT "feed_groups_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feedback" ADD CONSTRAINT "feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follows" ADD CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follows" ADD CONSTRAINT "follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_post_reports" ADD CONSTRAINT "forum_post_reports_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."forum_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_post_reports" ADD CONSTRAINT "forum_post_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_posts" ADD CONSTRAINT "forum_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_posts" ADD CONSTRAINT "forum_posts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."forum_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_posts" ADD CONSTRAINT "forum_posts_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."forum_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_threads" ADD CONSTRAINT "forum_threads_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_threads" ADD CONSTRAINT "forum_threads_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "public"."forums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forums" ADD CONSTRAINT "forums_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."forum_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forums" ADD CONSTRAINT "forums_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."forums"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gamification_events" ADD CONSTRAINT "gamification_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gamification_profiles" ADD CONSTRAINT "gamification_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."likes" ADD CONSTRAINT "likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."likes" ADD CONSTRAINT "likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."marketing_assets" ADD CONSTRAINT "marketing_assets_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "public"."marketing_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."marketing_order_items" ADD CONSTRAINT "marketing_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."marketing_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."marketing_orders" ADD CONSTRAINT "marketing_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member_match_actions" ADD CONSTRAINT "member_match_actions_escortId_fkey" FOREIGN KEY ("escortId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member_match_actions" ADD CONSTRAINT "member_match_actions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."feed_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."profile_analytics_events" ADD CONSTRAINT "profile_analytics_events_profileUserId_fkey" FOREIGN KEY ("profileUserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."profile_analytics_events" ADD CONSTRAINT "profile_analytics_events_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."profile_visits" ADD CONSTRAINT "profile_visits_profileUserId_fkey" FOREIGN KEY ("profileUserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."profile_visits" ADD CONSTRAINT "profile_visits_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rentals" ADD CONSTRAINT "rentals_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."review_tickets" ADD CONSTRAINT "review_tickets_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."review_tickets" ADD CONSTRAINT "review_tickets_redeemedById_fkey" FOREIGN KEY ("redeemedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."review_tickets" ADD CONSTRAINT "review_tickets_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stories" ADD CONSTRAINT "stories_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."story_views" ADD CONSTRAINT "story_views_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "public"."stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."story_views" ADD CONSTRAINT "story_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."thread_subscriptions" ADD CONSTRAINT "thread_subscriptions_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."forum_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."thread_subscriptions" ADD CONSTRAINT "thread_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_addon_bookings" ADD CONSTRAINT "user_addon_bookings_addonOptionId_fkey" FOREIGN KEY ("addonOptionId") REFERENCES "public"."addon_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_addon_bookings" ADD CONSTRAINT "user_addon_bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_addon_states" ADD CONSTRAINT "user_addon_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_badges" ADD CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "public"."badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_memberships" ADD CONSTRAINT "user_memberships_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."membership_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_memberships" ADD CONSTRAINT "user_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_perks" ADD CONSTRAINT "user_perks_perkId_fkey" FOREIGN KEY ("perkId") REFERENCES "public"."perks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_perks" ADD CONSTRAINT "user_perks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."verification_requests" ADD CONSTRAINT "verification_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."verification_requests" ADD CONSTRAINT "verification_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
