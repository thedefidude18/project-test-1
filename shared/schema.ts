import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  primaryKey,
  unique,
  json,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Core user table - Required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
  level: integer("level").default(1),
  xp: integer("xp").default(0),
  points: integer("points").default(1000),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00"),
  referralCode: varchar("referral_code").unique(),
  referredBy: varchar("referred_by"),
  streak: integer("streak").default(0),
  status: varchar("status").default("active"), // active, banned, suspended, inactive
  isAdmin: boolean("is_admin").default(false),
  isTelegramUser: boolean("is_telegram_user").default(false),
  telegramId: varchar("telegram_id"),
  telegramUsername: varchar("telegram_username"),
  coins: integer("coins").default(0), // For Telegram users
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Events for prediction betting
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // crypto, sports, gaming, music, politics
  status: varchar("status").default("active"), // active, completed, cancelled, pending_admin
  creatorId: varchar("creator_id").notNull(),
  eventPool: integer("event_pool").default(0), // Single unified pool in coins
  yesPool: integer("yes_pool").default(0), // For display purposes in coins
  noPool: integer("no_pool").default(0), // For display purposes in coins
  entryFee: integer("entry_fee").notNull(), // Changed to coins
  endDate: timestamp("end_date").notNull(),
  result: boolean("result"), // true for yes, false for no, null for pending
  adminResult: boolean("admin_result"), // Admin's final decision on event outcome
  creatorFee: integer("creator_fee").default(0), // 3% creator fee in coins
  isPrivate: boolean("is_private").default(false), // Private events need approval
  maxParticipants: integer("max_participants").default(100), // FCFS limit
  imageUrl: varchar("image_url"),
  chatEnabled: boolean("chat_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event participation tracking
export const eventParticipants = pgTable("event_participants", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: varchar("user_id").notNull(),
  prediction: boolean("prediction").notNull(), // true for yes, false for no
  amount: integer("amount").notNull(), // Changed to coins
  status: varchar("status").default("active"), // active, matched, won, lost
  matchedWith: varchar("matched_with"), // User ID of opponent (for FCFS matching)
  payout: integer("payout").default(0), // Winner payout amount in coins
  joinedAt: timestamp("joined_at").defaultNow(),
  payoutAt: timestamp("payout_at"),
});

// Event pool betting amounts
export const eventPools = pgTable("event_pools", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  yesAmount: integer("yes_amount").default(0), // In coins
  noAmount: integer("no_amount").default(0), // In coins
  totalPool: integer("total_pool").default(0), // In coins
  creatorFeeCollected: boolean("creator_fee_collected").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event join requests for private events
export const eventJoinRequests = pgTable("event_join_requests", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: varchar("user_id").notNull(),
  prediction: boolean("prediction").notNull(), // true for yes, false for no
  amount: integer("amount").notNull(), // In coins
  status: varchar("status").default("pending"), // pending, approved, rejected
  requestedAt: timestamp("requested_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

// Real-time chat messages in events
export const eventMessages = pgTable("event_messages", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  replyToId: integer("reply_to_id").references(() => eventMessages.id, { onDelete: "set null" }),
  mentions: json("mentions").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messageReactions = pgTable("message_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => eventMessages.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserMessageEmoji: unique().on(table.messageId, table.userId, table.emoji),
}));

// Live typing indicators
export const eventTyping = pgTable("event_typing", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: varchar("user_id").notNull(),
  isTyping: boolean("is_typing").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Join/leave activity logs
export const eventActivity = pgTable("event_activity", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: varchar("user_id").notNull(),
  action: varchar("action").notNull(), // joined, left, bet_placed
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// P2P betting matches between users
export const eventMatches = pgTable("event_matches", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  challenger: varchar("challenger").notNull(),
  challenged: varchar("challenged").notNull(),
  amount: integer("amount").notNull(), // In coins
  status: varchar("status").default("pending"), // pending, accepted, completed, cancelled
  result: varchar("result"), // challenger_won, challenged_won, draw
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Peer-to-peer challenges with escrow
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  challenger: varchar("challenger").notNull(),
  challenged: varchar("challenged").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  amount: integer("amount").notNull(), // Changed to coins
  status: varchar("status").default("pending"), // pending, active, completed, disputed, cancelled
  evidence: jsonb("evidence"),
  result: varchar("result"), // challenger_won, challenged_won, draw
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Real-time chat in challenges
export const challengeMessages = pgTable("challenge_messages", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull(),
  userId: varchar("user_id").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Secure fund holding for challenges
export const escrow = pgTable("escrow", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull(),
  amount: integer("amount").notNull(), // In coins
  status: varchar("status").default("holding"), // holding, released, refunded
  createdAt: timestamp("created_at").defaultNow(),
  releasedAt: timestamp("released_at"),
});

// Friend connections and requests
export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  requesterId: varchar("requester_id").notNull(),
  addresseeId: varchar("addressee_id").notNull(),
  status: varchar("status").default("pending"), // pending, accepted, blocked
  createdAt: timestamp("created_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
});

// Achievement definitions
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon"),
  category: varchar("category"),
  xpReward: integer("xp_reward").default(0),
  pointsReward: integer("points_reward").default(0),
  requirement: jsonb("requirement"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User achievement unlocks
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  achievementId: integer("achievement_id").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// System notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  type: varchar("type").notNull(), // achievement, challenge, event, match, friend
  title: text("title").notNull(),
  message: text("message"),
  data: jsonb("data"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// All financial transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  type: varchar("type").notNull(), // deposit, withdrawal, bet, win, challenge, referral
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  relatedId: integer("related_id"), // eventId, challengeId, etc.
  status: varchar("status").default("completed"), // pending, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily login streaks and rewards
export const dailyLogins = pgTable("daily_logins", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  date: timestamp("date").notNull(),
  streak: integer("streak").default(1),
  pointsEarned: integer("points_earned").default(50),
  claimed: boolean("claimed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Referral system with rewards
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: varchar("referrer_id").notNull(),
  referredId: varchar("referred_id").notNull(),
  code: varchar("code").notNull(),
  status: varchar("status").default("active"), // active, completed, expired
  createdAt: timestamp("created_at").defaultNow(),
});

// Referral reward tracking
export const referralRewards = pgTable("referral_rewards", {
  id: serial("id").primaryKey(),
  referralId: integer("referral_id").notNull(),
  userId: varchar("user_id").notNull(),
  type: varchar("type").notNull(), // signup_bonus, activity_bonus
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI recommendation preferences
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  eventCategories: jsonb("event_categories"), // preferred categories
  riskLevel: varchar("risk_level").default("medium"), // low, medium, high
  notifications: jsonb("notifications"), // notification preferences
  privacy: jsonb("privacy"), // privacy settings
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User behavior tracking for AI
export const userInteractions = pgTable("user_interactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  type: varchar("type").notNull(), // view, click, bet, share
  entityType: varchar("entity_type").notNull(), // event, challenge, user
  entityId: varchar("entity_id").notNull(),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  events: many(events, { relationName: "creator" }),
  eventParticipants: many(eventParticipants),
  eventMessages: many(eventMessages),
  challengesCreated: many(challenges, { relationName: "challenger" }),
  challengesReceived: many(challenges, { relationName: "challenged" }),
  friendRequestsSent: many(friends, { relationName: "requester" }),
  friendRequestsReceived: many(friends, { relationName: "addressee" }),
  achievements: many(userAchievements),
  notifications: many(notifications),
  transactions: many(transactions),
  dailyLogins: many(dailyLogins),
  referralsMade: many(referrals, { relationName: "referrer" }),
  referredBy: one(referrals, {
    fields: [users.referredBy],
    references: [referrals.referrerId],
    relationName: "referred"
  }),
  preferences: one(userPreferences),
  interactions: many(userInteractions),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, {
    fields: [events.creatorId],
    references: [users.id],
    relationName: "creator"
  }),
  participants: many(eventParticipants),
  messages: many(eventMessages),
  pools: many(eventPools),
  activity: many(eventActivity),
  matches: many(eventMatches),
}));

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  challengerUser: one(users, {
    fields: [challenges.challenger],
    references: [users.id],
    relationName: "challenger"
  }),
  challengedUser: one(users, {
    fields: [challenges.challenged],
    references: [users.id],
    relationName: "challenged"
  }),
  messages: many(challengeMessages),
  escrow: one(escrow),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertEventJoinRequestSchema = createInsertSchema(eventJoinRequests).omit({
  id: true,
  requestedAt: true,
  respondedAt: true,
});

// Platform settings table
export const platformSettings = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  maintenanceMode: boolean("maintenance_mode").default(false),
  registrationEnabled: boolean("registration_enabled").default(true),
  minBetAmount: decimal("min_bet_amount", { precision: 10, scale: 2 }).default("100.00"),
  maxBetAmount: decimal("max_bet_amount", { precision: 10, scale: 2 }).default("100000.00"),
  platformFeePercentage: decimal("platform_fee_percentage", { precision: 3, scale: 1 }).default("5.0"),
  creatorFeePercentage: decimal("creator_fee_percentage", { precision: 3, scale: 1 }).default("3.0"),
  withdrawalEnabled: boolean("withdrawal_enabled").default(true),
  depositEnabled: boolean("deposit_enabled").default(true),
  maxWithdrawalDaily: decimal("max_withdrawal_daily", { precision: 10, scale: 2 }).default("50000.00"),
  maxDepositDaily: decimal("max_deposit_daily", { precision: 10, scale: 2 }).default("100000.00"),
  challengeCooldown: integer("challenge_cooldown").default(300), // seconds
  eventCreationEnabled: boolean("event_creation_enabled").default(true),
  chatEnabled: boolean("chat_enabled").default(true),
  maxChatLength: integer("max_chat_length").default(500),
  autoModeration: boolean("auto_moderation").default(true),
  welcomeMessage: text("welcome_message").default("Welcome to BetChat! Start creating events and challenges."),
  supportEmail: varchar("support_email").default("support@betchat.com"),
  termsUrl: varchar("terms_url").default("/terms"),
  privacyUrl: varchar("privacy_url").default("/privacy"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPlatformSettingsSchema = createInsertSchema(platformSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Push subscriptions table for web push notifications
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
});

// Push subscriptions relations
export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type Friend = typeof friends.$inferSelect;
export type EventParticipant = typeof eventParticipants.$inferSelect;
export type EventMessage = typeof eventMessages.$inferSelect;
export type ChallengeMessage = typeof challengeMessages.$inferSelect;
export type EventJoinRequest = typeof eventJoinRequests.$inferSelect;
export type InsertEventJoinRequest = typeof eventJoinRequests.$inferInsert;
export type MessageReaction = typeof messageReactions.$inferSelect;
export type InsertMessageReaction = typeof messageReactions.$inferInsert;
export type PlatformSettings = typeof platformSettings.$inferSelect;
export type InsertPlatformSettings = z.infer<typeof insertPlatformSettingsSchema>;