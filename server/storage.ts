import {
  users,
  events,
  challenges,
  notifications,
  transactions,
  friends,
  achievements,
  userAchievements,
  eventParticipants,
  eventMessages,
  challengeMessages,
  dailyLogins,
  referrals,
  referralRewards,
  userPreferences,
  userInteractions,
  eventJoinRequests,
  eventPools,
  messageReactions,
  eventTyping,
  eventActivity,
  escrow,
  platformSettings,
  pushSubscriptions,
  type User,
  type UpsertUser,
  type Event,
  type InsertEvent,
  type Challenge,
  type InsertChallenge,
  type Notification,
  type InsertNotification,
  type Transaction,
  type InsertTransaction,
  type Achievement,
  type Friend,
  type EventParticipant,
  type EventMessage,
  type ChallengeMessage,
  type EventJoinRequest,
  type InsertEventJoinRequest,
  type MessageReaction,
  type InsertMessageReaction,
  type PlatformSettings,
  type InsertPlatformSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, count, sum, inArray, asc, isNull } from "drizzle-orm";
import { nanoid } from 'nanoid';

export interface IStorage {
  // User operations - Required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, updates: Partial<User>): Promise<User>;
  updateNotificationPreferences(userId: string, preferences: any): Promise<void>;
  getUserStats(userId: string): Promise<any>;
  getUserCreatedEvents(userId: string): Promise<any[]>;
  getUserJoinedEvents(userId: string): Promise<any[]>;
  getUserAchievements(userId: string): Promise<any[]>;
  getUserProfile(userId: string, currentUserId: string): Promise<any>;
  getAdminStats(): Promise<any>;
  getRecentUsers(limit: number): Promise<any[]>;
  getPlatformActivity(limit: number): Promise<any[]>;
  banUser(userId: string, reason: string): Promise<User>;
  unbanUser(userId: string, reason: string): Promise<User>;
  adjustUserBalance(userId: string, amount: number, reason: string): Promise<User>;
  setUserAdminStatus(userId: string, isAdmin: boolean, reason: string): Promise<User>;
  sendAdminMessage(userId: string, message: string, reason: string): Promise<any>;
  checkDailyLogin(userId: string): Promise<any>;

  // Event operations
  getEvents(limit?: number): Promise<Event[]>;
  getEventById(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, updates: Partial<Event>): Promise<Event>;
  joinEvent(eventId: number, userId: string, prediction: boolean, amount: number): Promise<EventParticipant>;
  getEventParticipants(eventId: number): Promise<EventParticipant[]>;
  getEventMessages(eventId: number, limit?: number): Promise<any[]>;
  createEventMessage(eventId: number, userId: string, message: string, replyToId?: string, mentions?: string[], telegramUser?: any): Promise<EventMessage>;
  getEventMessageById(messageId: string): Promise<EventMessage | undefined>;
  toggleMessageReaction(messageId: string, userId: string, emoji: string): Promise<any>;
  getMessageReactions(messageId: string): Promise<any[]>;
  getEventParticipantsWithUsers(eventId: number): Promise<any[]>;

  // Event Pool operations
  adminSetEventResult(eventId: number, result: boolean): Promise<Event>;
  processEventPayout(eventId: number): Promise<{ winnersCount: number; totalPayout: number; creatorFee: number }>;
  getEventPoolStats(eventId: number): Promise<{ totalPool: number; yesPool: number; noPool: number; participantsCount: number }>;
  getEventParticipantsWithUsers(eventId: number): Promise<(EventParticipant & { user: User })[]>;
  getEventMessageById(messageId: number): Promise<EventMessage | undefined>;
  createEventMessage(eventId: number, userId: string, message: string, replyToId?: number, mentions?: string[]): Promise<EventMessage>;
  toggleMessageReaction(messageId: string, userId: string, emoji: string): Promise<any>;

  // Private event operations
  requestEventJoin(eventId: number, userId: string, prediction: boolean, amount: number): Promise<EventJoinRequest>;
  getEventJoinRequests(eventId: number): Promise<(EventJoinRequest & { user: User })[]>;
  approveEventJoinRequest(requestId: number): Promise<EventParticipant>;
  rejectEventJoinRequest(requestId: number): Promise<EventJoinRequest>;

  // Challenge operations
  getChallenges(userId: string, limit?: number): Promise<(Challenge & { challengerUser: User, challengedUser: User })[]>;
  getChallengeById(id: number): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallenge(id: number, updates: Partial<Challenge>): Promise<Challenge>;
  getChallengeMessages(challengeId: number): Promise<(ChallengeMessage & { user: User })[]>;
  createChallengeMessage(challengeId: number, userId: string, message: string): Promise<ChallengeMessage>;

  // Admin challenge operations
  getAllChallenges(limit?: number): Promise<(Challenge & { challengerUser: User, challengedUser: User })[]>;
  adminSetChallengeResult(challengeId: number, result: 'challenger_won' | 'challenged_won' | 'draw'): Promise<Challenge>;
  processChallengePayouts(challengeId: number): Promise<{ winnerPayout: number; platformFee: number; winnerId?: string }>;
  getChallengeEscrowStatus(challengeId: number): Promise<{ totalEscrow: number; status: string } | null>;

  // Friend operations
  getFriends(userId: string): Promise<(Friend & { requester: User, addressee: User })[]>;
  sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friend>;
  acceptFriendRequest(id: number): Promise<Friend>;
  toggleFollow(followerId: string, followingId: string): Promise<{ action: 'followed' | 'unfollowed' }>;

  // Notification operations
  getNotifications(userId: string, limit?: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<Notification>;

  // Transaction operations
  getTransactions(userId: string, limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserBalance(userId: string): Promise<number>;
  updateUserBalance(userId: string, amount: number): Promise<User>;

  // Achievement operations
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<(Achievement & { unlockedAt: Date })[]>;
  unlockAchievement(userId: string, achievementId: number): Promise<void>;

  // Leaderboard operations
  getLeaderboard(limit?: number): Promise<(User & { rank: number })[]>;

  // Referral operations
  createReferral(referrerId: string, referredId: string, code: string): Promise<void>;
  getReferrals(userId: string): Promise<any[]>;

  // User stats
  getUserStats(userId: string): Promise<{
    wins: number;
    activeChallenges: number;
    friendsOnline: number;
  }>;

  // Get all users
  getAllUsers(): Promise<User[]>;

  // Global Chat
  createGlobalChatMessage(messageData: any): Promise<any>;
  getGlobalChatMessages(limit?: number): Promise<any[]>;

  // Admin Management Functions
  deleteEvent(eventId: number): Promise<void>;
  toggleEventChat(eventId: number, enabled: boolean): Promise<void>;
  deleteChallenge(challengeId: number): Promise<void>;

  // Admin Functions
  getAdminStats(): Promise<any>;

  // Platform Settings
  getPlatformSettings(): Promise<PlatformSettings>;
  updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<PlatformSettings>;

  // Advanced Admin Tools
  addEventFunds(eventId: number, amount: number): Promise<void>;
  giveUserPoints(userId: string, points: number): Promise<void>;
  updateEventCapacity(eventId: number, additionalSlots: number): Promise<void>;

  // Event lifecycle notifications
  notifyEventStarting(eventId: number): Promise<void>;
  notifyEventEnding(eventId: number): Promise<void>;
  notifyFundsReleased(userId: string, eventId: number, amount: number, isWinner: boolean): Promise<void>;

  // Push Notification operations
  savePushSubscription(userId: string, subscription: any): Promise<void>;
  getPushSubscriptions(userId: string): Promise<any[]>;
  removePushSubscription(endpoint: string): Promise<void>;
  broadcastMessage(message: string, type: string): Promise<void>;

  // Missing admin functions
  getAdminNotifications(limit: number): Promise<any[]>;
  broadcastNotification(data: any): Promise<any>;
  searchUsers(query: string, limit: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations - Required for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      or(
        eq(users.username, usernameOrEmail),
        eq(users.email, usernameOrEmail)
      )
    );
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        referralCode: userData.referralCode || this.generateReferralCode(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateNotificationPreferences(userId: string, preferences: any): Promise<void> {
    // Store notification preferences in user preferences table or update user record
    // For now, we'll store them as JSON in the user record or create a separate preferences system
    await db
      .update(users)
      .set({
        notificationPreferences: JSON.stringify(preferences),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Event operations
  async getEvents(limit = 10): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .orderBy(desc(events.createdAt))
      .limit(limit);
  }

  async getEventById(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const eventData = {
      ...event,
      eventPool: '0',
      yesPool: '0',
      noPool: '0',
      creatorFee: '0',
    };
    const [newEvent] = await db.insert(events).values(eventData).returning();
    return newEvent;
  }

  async updateEvent(id: number, updates: Partial<Event>): Promise<Event> {
    const [event] = await db
      .update(events)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return event;
  }

  async joinEvent(eventId: number, userId: string, prediction: boolean, amount: number): Promise<EventParticipant> {
    // Get event to validate betting model and amount
    const event = await this.getEventById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const minAmount = parseFloat(event.entryFee);

    // Validate amount based on betting model
    if (event.bettingModel === "fixed") {
      if (Math.abs(amount - minAmount) > 0.01) { // Allow for floating point precision
        throw new Error(`Fixed betting model requires exactly ₦${minAmount}`);
      }
    } else if (event.bettingModel === "custom") {
      if (amount < minAmount) {
        throw new Error(`Custom betting requires minimum ₦${minAmount}`);
      }

      // Add reasonable maximum to prevent abuse (10x the minimum)
      const maxAmount = minAmount * 10;
      if (amount > maxAmount) {
        throw new Error(`Maximum bet amount is ₦${maxAmount.toLocaleString()}`);
      }
    }

    // First, try to find an unmatched participant with opposite prediction (FCFS)
    const oppositeParticipant = await db
      .select()
      .from(eventParticipants)
      .where(
        and(
          eq(eventParticipants.eventId, eventId),
          eq(eventParticipants.prediction, !prediction), // Opposite prediction
          eq(eventParticipants.status, "active"), // Not yet matched
          isNull(eventParticipants.matchedWith) // No opponent assigned
        )
      )
      .orderBy(asc(eventParticipants.joinedAt)) // FCFS order
      .limit(1);

    const [participant] = await db
      .insert(eventParticipants)
      .values({
        eventId,
        userId,
        prediction,
        amount: amount.toString(),
      })
      .returning();

    // If opponent found, match them (FCFS matching)
    if (oppositeParticipant.length > 0) {
      const opponent = oppositeParticipant[0];

      // Update both participants to "matched" status
      await db
        .update(eventParticipants)
        .set({ 
          status: "matched",
          matchedWith: userId 
        })
        .where(eq(eventParticipants.id, opponent.id));

      await db
        .update(eventParticipants)
        .set({ 
          status: "matched",
          matchedWith: opponent.userId 
        })
        .where(eq(eventParticipants.id, participant.id));
    }

    // Update event pools (both individual and total)
    if (prediction) {
      await db
        .update(events)
        .set({
          yesPool: sql`${events.yesPool} + ${amount}`,
          eventPool: sql`${events.eventPool} + ${amount}`,
        })
        .where(eq(events.id, eventId));
    } else {
      await db
        .update(events)
        .set({
          noPool: sql`${events.noPool} + ${amount}`,
          eventPool: sql`${events.eventPool} + ${amount}`,
        })
        .where(eq(events.id, eventId));
    }

    return participant;
  }

  async getEventParticipants(eventId: number): Promise<EventParticipant[]> {
    return await db
      .select()
      .from(eventParticipants)
      .where(eq(eventParticipants.eventId, eventId));
  }

  async getEventMessages(eventId: number, limit = 50): Promise<any[]> {
    const messages = await db
      .select({
        id: eventMessages.id,
        eventId: eventMessages.eventId,
        userId: eventMessages.userId,
        message: eventMessages.message,
        replyToId: eventMessages.replyToId,
        mentions: eventMessages.mentions,
        createdAt: eventMessages.createdAt,
        user: users,
      })
      .from(eventMessages)
      .innerJoin(users, eq(eventMessages.userId, users.id))
      .where(eq(eventMessages.eventId, eventId))
      .orderBy(desc(eventMessages.createdAt))
      .limit(limit);

    // Get reactions for each message
    const messageIds = messages.map(m => m.id);
    const reactions = messageIds.length > 0 ? await db
      .select({
        messageId: messageReactions.messageId,
        emoji: messageReactions.emoji,
        userId: messageReactions.userId,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
        }
      })
      .from(messageReactions)
      .innerJoin(users, eq(messageReactions.userId, users.id))
      .where(inArray(messageReactions.messageId, messageIds)) : [];

    // Get reply-to messages
    const replyToIds = messages.filter(m => m.replyToId).map(m => m.replyToId);
    const replyToMessages = replyToIds.length > 0 ? await db
      .select({
        id: eventMessages.id,
        message: eventMessages.message,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
        }
      })
      .from(eventMessages)
      .innerJoin(users, eq(eventMessages.userId, users.id))
      .where(inArray(eventMessages.id, replyToIds)) : [];

    // Combine data
    return messages.map(message => {
      const msgReactions = reactions.filter(r => r.messageId === message.id);
      const reactionSummary = msgReactions.reduce((acc: any[], reaction) => {
        const existing = acc.find(r => r.emoji === reaction.emoji);
        if (existing) {
          existing.count++;
          existing.users.push(reaction.user.username || reaction.user.firstName);
          if (reaction.userId === message.userId) {
            existing.userReacted = true;
          }
        } else {
          acc.push({
            emoji: reaction.emoji,
            count: 1,
            users: [reaction.user.username || reaction.user.firstName],
            userReacted: reaction.userId === message.userId,
          });
        }
        return acc;
      }, []);

      const replyTo = message.replyToId ? 
        replyToMessages.find(r => r.id === message.replyToId) : null;

      return {
        ...message,
        reactions: reactionSummary,
        replyTo,
      };
    });
  }

  async createGlobalChatMessage(messageData: any) {
    try {
      const [newMessage] = await db.insert(eventMessages).values({
        eventId: null, // Global chat messages don't belong to specific events
        userId: messageData.userId,
        message: messageData.message,
        replyToId: messageData.replyToId || null,
        mentions: messageData.mentions || null,
      }).returning();

      // Get user info for the message
      const user = messageData.user || await this.getUser(messageData.userId);

      return {
        ...newMessage,
        user: user || {
          id: messageData.userId,
          firstName: 'Unknown User',
          username: messageData.userId,
          profileImageUrl: null,
        }
      };
    } catch (error) {
      console.error("Error creating global chat message:", error);
      throw error;
    }
  }

  async getGlobalChatMessages(limit = 50) {
    try {
      const messagesWithUsers = await db
        .select({
          id: eventMessages.id,
          userId: eventMessages.userId,
          message: eventMessages.message,
          createdAt: eventMessages.createdAt,
          replyToId: eventMessages.replyToId,
          mentions: eventMessages.mentions,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            username: users.username,
            profileImageUrl: users.profileImageUrl,
          }
        })
        .from(eventMessages)
        .leftJoin(users, eq(eventMessages.userId, users.id))
        .where(sql`${eventMessages.eventId} IS NULL`) // Global chat messages
        .orderBy(sql`${eventMessages.createdAt} DESC`)
        .limit(limit);

      return messagesWithUsers;
    } catch (error) {
      console.error("Error fetching global chat messages:", error);
      throw error;
    }
  }

  async createEventMessage(eventId: number, userId: string, message: string, replyToId?: string, mentions?: string[], telegramUser?: any): Promise<EventMessage> {
    const [newMessage] = await db
      .insert(eventMessages)
      .values({ 
        eventId, 
        userId, 
        message, 
        replyToId: replyToId ? parseInt(replyToId) : null,
        mentions: mentions || []
      })
      .returning();

    // Get user info for the response
    let user;
    if (telegramUser) {
      // Use provided Telegram user info
      user = telegramUser;
    } else {
      // Get from database for regular BetChat users
      user = await this.getUser(userId);
    }

    return {
      ...newMessage,
      user: {
        id: user?.id,
        firstName: user?.firstName,
        lastName: user?.lastName,
        username: user?.username,
        profileImageUrl: user?.profileImageUrl,
        level: user?.level,
        isTelegramUser: telegramUser ? true : false,
      }
    };
  }

  async getEventMessageById(messageId: string): Promise<EventMessage | undefined> {
    const [message] = await db
      .select()
      .from(eventMessages)
      .where(eq(eventMessages.id, parseInt(messageId)));
    return message;
  }

  async toggleMessageReaction(messageId: string, userId: string, emoji: string): Promise<any> {
    // Check if reaction already exists
    const [existingReaction] = await db
      .select()
      .from(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, parseInt(messageId)),
          eq(messageReactions.userId, userId),
          eq(messageReactions.emoji, emoji)
        )
      );

    if (existingReaction) {
      // Remove reaction
      await db
        .delete(messageReactions)
        .where(eq(messageReactions.id, existingReaction.id));
      return { action: 'removed' };
    } else {
      // Add reaction
      const [newReaction] = await db
        .insert(messageReactions)
        .values({
          messageId: parseInt(messageId),
          userId,
          emoji,
        })
        .returning();
      return { action: 'added', reaction: newReaction };
    }
  }

  async getMessageReactions(messageId: string): Promise<any[]> {
    const reactions = await db
      .select({
        id: messageReactions.id,
        messageId: messageReactions.messageId,
        userId: messageReactions.userId,
        emoji: messageReactions.emoji,
        createdAt: messageReactions.createdAt,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
        }
      })
      .from(messageReactions)
      .innerJoin(users, eq(messageReactions.userId, users.id))
      .where(eq(messageReactions.messageId, parseInt(messageId)));

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc: any[], reaction) => {
      const existing = acc.find(r => r.emoji === reaction.emoji);
      if (existing) {
        existing.count++;
        existing.users.push(reaction.user.username || reaction.user.firstName);
      } else {
        acc.push({
          emoji: reaction.emoji,
          count: 1,
          users: [reaction.user.username || reaction.user.firstName],
          userReacted: false, // Will be set by caller based on current user
        });
      }
      return acc;
    }, []);

    return groupedReactions;
  }

  async getEventParticipantsWithUsers(eventId: number): Promise<any[]> {
    return await db
      .select({
        id: eventParticipants.id,
        eventId: eventParticipants.eventId,
        userId: eventParticipants.userId,
        prediction: eventParticipants.prediction,
        amount: eventParticipants.amount,
        user: users,
      })
      .from(eventParticipants)
      .innerJoin(users, eq(eventParticipants.userId, users.id))
      .where(eq(eventParticipants.eventId, eventId));
  }

  // Challenge operations
  async getChallenges(userId: string, limit = 10): Promise<(Challenge & { challengerUser: User, challengedUser: User })[]> {
    return await db
      .select({
        id: challenges.id,
        challenger: challenges.challenger,
        challenged: challenges.challenged,
        title: challenges.title,
        description: challenges.description,
        category: challenges.category,
        amount: challenges.amount,
        status: challenges.status,
        evidence: challenges.evidence,
        result: challenges.result,
        dueDate: challenges.dueDate,
        createdAt: challenges.createdAt,
        completedAt: challenges.completedAt,
        challengerUser: {
          id: sql`challenger_user.id`,
          username: sql`challenger_user.username`,
          firstName: sql`challenger_user.first_name`,
          lastName: sql`challenger_user.last_name`,
          profileImageUrl: sql`challenger_user.profile_image_url`,
        },
        challengedUser: {
          id: sql`challenged_user.id`,
          username: sql`challenged_user.username`,
          firstName: sql`challenged_user.first_name`,
          lastName: sql`challenged_user.last_name`,
          profileImageUrl: sql`challenged_user.profile_image_url`,
        },
      })
      .from(challenges)
      .innerJoin(sql`users challenger_user`, eq(challenges.challenger, sql`challenger_user.id`))
      .innerJoin(sql`users challenged_user`, eq(challenges.challenged, sql`challenged_user.id`))
      .where(or(eq(challenges.challenger, userId), eq(challenges.challenged, userId)))
      .orderBy(desc(challenges.createdAt))
      .limit(limit) as any;
  }

  async getChallengeById(id: number): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    return challenge;
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    // Check challenger balance
    const balance = await this.getUserBalance(challenge.challenger);
    const challengeAmount = parseFloat(challenge.amount);

    if (balance.balance < challengeAmount) {
      throw new Error("Insufficient balance to create challenge");
    }

    // Create the challenge
    const [newChallenge] = await db.insert(challenges).values(challenge).returning();

    // Deduct challenger's stake and create escrow
    await this.createTransaction({
      userId: challenge.challenger,
      type: 'challenge_escrow',
      amount: `-${challengeAmount}`,
      description: `Challenge escrow: ${challenge.title}`,
      relatedId: newChallenge.id,
      status: 'completed',
    });

    // Create escrow record
    await db.insert(escrow).values({
      challengeId: newChallenge.id,
      amount: challengeAmount.toString(),
      status: 'holding',
    });

    return newChallenge;
  }

  async updateChallenge(id: number, updates: Partial<Challenge>): Promise<Challenge> {
    const [challenge] = await db
      .update(challenges)
      .set(updates)
      .where(eq(challenges.id, id))
      .returning();
    return challenge;
  }

  async acceptChallenge(challengeId: number, userId: string): Promise<Challenge> {
    const challenge = await this.getChallengeById(challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    if (challenge.status !== 'pending') {
      throw new Error("Challenge cannot be accepted");
    }

    if (challenge.challenged !== userId) {
      throw new Error("You are not the challenged user");
    }

    // Check challenged user balance
    const balance = await this.getUserBalance(userId);
    const challengeAmount = parseFloat(challenge.amount);

    if (balance.balance < challengeAmount) {
      throw new Error("Insufficient balance to accept challenge");
    }

    // Deduct challenged user's stake
    await this.createTransaction({
      userId: userId,
      type: 'challenge_escrow',
      amount: `-${challengeAmount}`,
      description: `Challenge escrow: ${challenge.title}`,
      relatedId: challengeId,
      status: 'completed',
    });

    // Add to existing escrow
    await db.insert(escrow).values({
      challengeId: challengeId,
      amount: challengeAmount.toString(),
      status: 'holding',
    });

    // Update challenge status to active
    const [updatedChallenge] = await db
      .update(challenges)
      .set({ status: 'active' })
      .where(eq(challenges.id, challengeId))
      .returning();

    return updatedChallenge;
  }

  async getChallengeMessages(challengeId: number): Promise<(ChallengeMessage & { user: User })[]> {
    return await db
      .select({
        id: challengeMessages.id,
        challengeId: challengeMessages.challengeId,
        userId: challengeMessages.userId,
        message: challengeMessages.message,
        createdAt: challengeMessages.createdAt,
        user: users,
      })
      .from(challengeMessages)
      .innerJoin(users, eq(challengeMessages.userId, users.id))
      .where(eq(challengeMessages.challengeId, challengeId))
      .orderBy(desc(challengeMessages.createdAt));
  }

  async createChallengeMessage(challengeId: number, userId: string, message: string): Promise<ChallengeMessage> {
    const [newMessage] = await db
      .insert(challengeMessages)
      .values({ challengeId, userId, message })
      .returning();
    return newMessage;
  }

  // Admin challenge operations
  async getAllChallenges(limit = 50): Promise<(Challenge & { challengerUser: User, challengedUser: User })[]> {
    return await db
      .select({
        id: challenges.id,
        challenger: challenges.challenger,
        challenged: challenges.challenged,
        title: challenges.title,
        description: challenges.description,
        category: challenges.category,
        amount: challenges.amount,
        status: challenges.status,
        evidence: challenges.evidence,
        result: challenges.result,
        dueDate: challenges.dueDate,
        createdAt: challenges.createdAt,
        completedAt: challenges.completedAt,
        challengerUser: {
          id: sql`challenger_user.id`,
          username: sql`challenger_user.username`,
          firstName: sql`challenger_user.first_name`,
          lastName: sql`challenger_user.last_name`,
          profileImageUrl: sql`challenger_user.profile_image_url`,
        },
        challengedUser: {
          id: sql`challenged_user.id`,
          username: sql`challenged_user.username`,
          firstName: sql`challenged_user.first_name`,
          lastName: sql`challenged_user.last_name`,
          profileImageUrl: sql`challenged_user.profile_image_url`,
        },
      })
      .from(challenges)
      .innerJoin(sql`users challenger_user`, eq(challenges.challenger, sql`challenger_user.id`))
      .innerJoin(sql`users challenged_user`, eq(challenges.challenged, sql`challenged_user.id`))
      .orderBy(desc(challenges.createdAt))
      .limit(limit) as any;
  }

  async adminSetChallengeResult(challengeId: number, result: 'challenger_won' | 'challenged_won' | 'draw'): Promise<Challenge> {
    const [challenge] = await db
      .update(challenges)
      .set({ 
        result: result,
        status: 'completed',
        completedAt: new Date() 
      })
      .where(eq(challenges.id, challengeId))
      .returning();
    return challenge;
  }

  async processChallengePayouts(challengeId: number): Promise<{ winnerPayout: number; platformFee: number; winnerId?: string }> {
    const challenge = await this.getChallengeById(challengeId);
    if (!challenge || challenge.status !== 'completed' || !challenge.result) {
      throw new Error('Challenge not ready for payout');
    }

    const totalAmount = parseFloat(challenge.amount) * 2; // Both participants contributed
    const platformFeeRate = 0.05; // 5% platform fee
    const platformFee = totalAmount * platformFeeRate;
    const winnerPayout = totalAmount - platformFee;

    let winnerId: string | undefined;

    if (challenge.result === 'challenger_won') {
      winnerId = challenge.challenger;
    } else if (challenge.result === 'challenged_won') {
      winnerId = challenge.challenged;
    } else if (challenge.result === 'draw') {
      // In case of draw, return money to both participants
      const halfAmount = parseFloat(challenge.amount);
      await this.updateUserBalance(challenge.challenger, halfAmount);
      await this.updateUserBalance(challenge.challenged, halfAmount);

      // Create transactions for both
      await this.createTransaction({
        userId: challenge.challenger,
        type: 'challenge_draw',
        amount: halfAmount.toString(),
        description: `Draw in challenge: ${challenge.title}`,
        status: 'completed',
        reference: `challenge_${challengeId}_draw_challenger`,
      });

      await this.createTransaction({
        userId: challenge.challenged,
        type: 'challenge_draw',
        amount: halfAmount.toString(),
        description: `Draw in challenge: ${challenge.title}`,
        status: 'completed',
        reference: `challenge_${challengeId}_draw_challenged`,
      });

      // Send notifications
      await this.createNotification({
        userId: challenge.challenger,
        type: 'challenge_draw',
        title: 'Challenge Draw',
        message: `Challenge "${challenge.title}" ended in a draw. Your stake has been returned.`,
        data: { challengeId: challengeId, result: 'draw' },
      });

      await this.createNotification({
        userId: challenge.challenged,
        type: 'challenge_draw',
        title: 'Challenge Draw',
        message: `Challenge "${challenge.title}" ended in a draw. Your stake has been returned.`,
        data: { challengeId: challengeId, result: 'draw' },
      });

      return { winnerPayout: halfAmount * 2, platformFee: 0, winnerId: undefined };
    }

    if (winnerId) {
      // Update winner's balance
      await this.updateUserBalance(winnerId, winnerPayout);

      // Create transaction record
      await this.createTransaction({
        userId: winnerId,
        type: 'challenge_win',
        amount: winnerPayout.toString(),
        description: `Won challenge: ${challenge.title}`,
        status: 'completed',
        reference: `challenge_${challengeId}_win`,
      });

      // Send notifications to both participants
      const winner = await this.getUser(winnerId);
      const loser = winnerId === challenge.challenger ? challenge.challenged : challenge.challenger;

      await this.createNotification({
        userId: winnerId,
        type: 'challenge_win',
        title: 'Challenge Won!',
        message: `Congratulations! You won ₦${winnerPayout.toLocaleString()} from challenge "${challenge.title}".`,
        data: { challengeId: challengeId, result: challenge.result, winnings: winnerPayout },
      });

      await this.createNotification({
        userId: loser,
        type: 'challenge_loss',
        title: 'Challenge Result',
        message: `Challenge "${challenge.title}" has been resolved. Better luck next time!`,
        data: { challengeId: challengeId, result: challenge.result },
      });
    }

    return { winnerPayout, platformFee, winnerId };
  }

  async getChallengeEscrowStatus(challengeId: number): Promise<{ totalEscrow: number; status: string } | null> {
    const [escrowData] = await db
      .select({
        totalEscrow: sql<number>`COALESCE(SUM(CAST(${escrow.amount} AS DECIMAL)), 0)`,
        status: escrow.status,
      })
      .from(escrow)
      .where(eq(escrow.challengeId, challengeId))
      .groupBy(escrow.status);

    return escrowData || null;
  }

  // Friend operations
  async getFriends(userId: string): Promise<(Friend & { requester: User, addressee: User })[]> {
    return await db
      .select({
        id: friends.id,
        requesterId: friends.requesterId,
        addresseeId: friends.addresseeId,
        status: friends.status,
        createdAt: friends.createdAt,
        acceptedAt: friends.acceptedAt,
        requester: sql`requester`,
        addressee: sql`addressee`,
      })
      .from(friends)
      .innerJoin(sql`users requester`, eq(friends.requesterId, sql`requester.id`))
      .innerJoin(sql`users addressee`, eq(friends.addresseeId, sql`addressee.id`))
      .where(
        and(
          or(eq(friends.requesterId, userId), eq(friends.addresseeId, userId)),
          eq(friends.status, "accepted")
        )
      ) as any;
  }

  async sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friend> {
    const [friendRequest] = await db
      .insert(friends)
      .values({ requesterId, addresseeId, status: "pending" })
      .returning();
    return friendRequest;
  }

  async acceptFriendRequest(id: number): Promise<Friend> {
    const [friend] = await db
      .update(friends)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(eq(friends.id, id))
      .returning();
    return friend;
  }

  async toggleFollow(followerId: string, followingId: string): Promise<{ action: 'followed' | 'unfollowed' }> {
    // Check if follow relationship exists
    const [existingFollow] = await db
      .select()
      .from(friends)
      .where(
        and(
          eq(friends.requesterId, followerId),
          eq(friends.addresseeId, followingId),
          eq(friends.status, 'accepted')
        )
      );

    if (existingFollow) {
      // Unfollow: Delete the relationship
      await db
        .delete(friends)
        .where(eq(friends.id, existingFollow.id));
      return { action: 'unfollowed' };
    } else {
      // Follow: Create new relationship (auto-accepted for follow system)
      await db
        .insert(friends)
        .values({
          requesterId: followerId,
          addresseeId: followingId,
          status: 'accepted',
          acceptedAt: new Date()
        });
      return { action: 'followed' };
    }
  }

  // Notification operations
  async getNotifications(userId: string, limit = 20): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationRead(id: number): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  // Transaction operations
  async getTransactions(userId: string, limit = 20): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async getUserBalance(userId: string): Promise<{ balance: number; coins: number }> {
    try {
      // Get user's current coins from users table
      const user = await db
        .select({ coins: users.coins })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const currentCoins = user[0]?.coins || 0;

      // Calculate Naira balance from transactions
      const transactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId));

      let balance = 0;
      for (const transaction of transactions) {
        const amount = parseFloat(transaction.amount);
        // Only include completed transactions in balance calculation
        if (transaction.status === 'completed') {
          balance += amount;
        }
      }

      console.log(`Balance calculation for user ${userId}:`, {
        totalTransactions: transactions.length,
        completedTransactions: transactions.filter(t => t.status === 'completed').length,
        calculatedBalance: balance,
        currentCoins
      });

      return { 
        balance: Math.max(0, balance), // Ensure balance is never negative
        coins: currentCoins 
      };
    } catch (error) {
      console.error("Error getting user balance:", error);
      return { balance: 0, coins: 0 };
    }
  }

  async updateUserBalance(userId: string, amount: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        balance: sql`${users.balance} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    console.log('Creating transaction:', {
      userId: transaction.userId,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      reference: transaction.reference
    });

    try {
      const [newTransaction] = await db
        .insert(transactions)
        .values(transaction)
        .returning();

      console.log('Transaction created:', newTransaction);

      // Update user balance for specific transaction types
      if (transaction.type === 'deposit' || transaction.type === 'withdrawal' || transaction.type === 'win' || 
          transaction.type === 'event_escrow' || transaction.type === 'event_win' || transaction.type === 'tip_received' ||
          transaction.type === 'tip_sent') {
        const amount = parseFloat(transaction.amount);
        if (!isNaN(amount)) {
          console.log(`Updating user ${transaction.userId} balance by ${amount}`);
          
          await db
            .update(users)
            .set({
              balance: sql`COALESCE(${users.balance}, 0) + ${amount}`,
              updatedAt: new Date(),
            })
            .where(eq(users.id, transaction.userId));

          console.log(`User balance updated for ${transaction.userId}`);
        }
      }

      return newTransaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  // Achievement operations
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements);
  }

  async getUserAchievements(userId: string): Promise<(Achievement & { unlockedAt: Date })[]> {
    return await db
      .select({
        id: achievements.id,
        name: achievements.name,
        description: achievements.description,
        icon: achievements.icon,
        category: achievements.category,
        xpReward: achievements.xpReward,
        pointsReward: achievements.pointsReward,
        requirement: achievements.requirement,
        createdAt: achievements.createdAt,
        unlockedAt: userAchievements.unlockedAt,
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId)) as any;
  }

  async unlockAchievement(userId: string, achievementId: number): Promise<void> {
    await db
      .insert(userAchievements)
      .values({ userId, achievementId })
      .onConflictDoNothing();
  }

  // Leaderboard operations
  async getLeaderboard(limit = 10): Promise<(User & { rank: number })[]> {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        level: users.level,
        xp: users.xp,
        points: users.points,
        rank: sql<number>`ROW_NUMBER() OVER (ORDER BY ${users.points} DESC)`,
      })
      .from(users)
      .orderBy(desc(users.points))
      .limit(limit);

    return result as any;
  }

  // Referral operations
  async createReferral(referrerId: string, referredId: string, code: string): Promise<void> {
    await db.insert(referrals).values({
      referrerId,
      referredId,
      code,
    });
  }

  async getReferrals(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, userId));
  }

  // User stats
  async getUserStats(userId: string): Promise<{
    wins: number;
    activeChallenges: number;
    friendsOnline: number;
  }> {
    // Get wins count from completed events/challenges
    const [winsResult] = await db
      .select({ count: count() })
      .from(challenges)
      .where(
        and(
          or(eq(challenges.challenger, userId), eq(challenges.challenged, userId)),
          eq(challenges.status, "completed"),
          or(
            and(eq(challenges.challenger, userId), eq(challenges.result, "challenger_won")),
            and(eq(challenges.challenged, userId), eq(challenges.result, "challenged_won"))
          )
        )
      );

    // Get active challenges count
    const [activeChallengesResult] = await db
      .select({ count: count() })
      .from(challenges)
      .where(
        and(
          or(eq(challenges.challenger, userId), eq(challenges.challenged, userId)),
          eq(challenges.status, "active")
        )
      );

    // Get friends count (simplified - would need online status tracking in real app)
    const [friendsResult] = await db
      .select({ count: count() })
      .from(friends)
      .where(
        and(
          or(eq(friends.requesterId, userId), eq(friends.addresseeId, userId)),
          eq(friends.status, "accepted")
        )
      );

    return {
      wins: winsResult?.count || 0,
      activeChallenges: activeChallengesResult?.count || 0,
      friendsOnline: Math.floor((friendsResult?.count || 0) * 0.35), // Simulate ~35% online
    };
  }

  // Event Pool operations
  async adminSetEventResult(eventId: number, result: boolean): Promise<Event> {
    const [event] = await db
      .update(events)
      .set({ 
        adminResult: result,
        result: result,
        status: 'completed',
        updatedAt: new Date() 
      })
      .where(eq(events.id, eventId))
      .returning();
    return event;
  }

  async processEventPayout(eventId: number): Promise<{ winnersCount: number; totalPayout: number; creatorFee: number }> {
    const event = await this.getEventById(eventId);
    if (!event || event.status !== 'completed' || event.adminResult === null) {
      throw new Error('Event not ready for payout');
    }

    const participants = await this.getEventParticipants(eventId);
    const winners = participants.filter(p => p.prediction === event.adminResult);

    const totalPool = parseFloat(event.eventPool);
    const creatorFeeAmount = totalPool * 0.03; // 3% creator fee
    const availablePayout = totalPool - creatorFeeAmount;

    if (winners.length === 0) {
      // No winners - creator gets the entire pool
      await this.updateUserBalance(event.creatorId, totalPool);
      await this.createTransaction({
        userId: event.creatorId,
        type: 'event_no_winners',
        amount: totalPool.toString(),
        description: `No winners bonus for event: ${event.title}`,
        status: 'completed',
        reference: `event_${eventId}_no_winners`,
      });

      return { winnersCount: 0, totalPayout: totalPool, creatorFee: 0 };
    }

    // Calculate individual payouts
    const totalWinnerBets = winners.reduce((sum, w) => sum + parseFloat(w.amount), 0);

    // Handle edge case where total winner bets exceed available payout (shouldn't happen but safety check)
    if (totalWinnerBets > availablePayout) {
      console.warn(`Event ${eventId}: Total winner bets (₦${totalWinnerBets}) exceed available payout (₦${availablePayout})`);
    }

    for (const winner of winners) {
      const winnerBet = parseFloat(winner.amount);
      const winnerShare = totalWinnerBets > 0 ? winnerBet / totalWinnerBets : 1 / winners.length;

      let payout;
      if (event.bettingModel === "fixed") {
        // Fixed model: equal share of the profit pool + original bet back
        const profitPool = Math.max(0, availablePayout - totalWinnerBets);
        payout = winnerBet + (profitPool / winners.length);
      } else {
        // Custom model: proportional payout
        payout = winnerBet + (Math.max(0, availablePayout - totalWinnerBets) * winnerShare);
      }

      // Ensure minimum payout is at least the original bet
      payout = Math.max(payout, winnerBet);

      // Update participant with payout info
      await db
        .update(eventParticipants)
        .set({ 
          status: 'won',
          payout: payout.toString(),
          payoutAt: new Date()
        })
        .where(eq(eventParticipants.id, winner.id));

      // Update user balance
      await this.updateUserBalance(winner.userId, payout);

      // Create transaction record
      await this.createTransaction({
        userId: winner.userId,
        type: 'event_win',
        amount: payout.toString(),
        description: `Won event: ${event.title}`,
        status: 'completed',
        reference: `event_${eventId}_win_${winner.id}`,
      });
    }

    // Mark losers
    const losers = participants.filter(p => p.prediction !== event.adminResult);
    for (const loser of losers) {
      await db
        .update(eventParticipants)
        .set({ status: 'lost' })
        .where(eq(eventParticipants.id, loser.id));
    }

    // Pay creator fee
    await this.updateUserBalance(event.creatorId, creatorFeeAmount);
    await this.createTransaction({
      userId: event.creatorId,
      type: 'creator_fee',
      amount: creatorFeeAmount.toString(),
      description: `Creator fee for event: ${event.title}`,
      status: 'completed',
      reference: `event_${eventId}_creator_fee`,
    });

    // Notify losers about funds release (they get nothing back)
    for (const loser of losers) {
      await this.notifyFundsReleased(loser.userId, eventId, 0, false);
    }

    // Notify winners about their winnings (already handled above in winner loop)
    // Update event creator fee collected
    await db
      .update(events)
      .set({ creatorFee: creatorFeeAmount.toString() })
      .where(eq(events.id, eventId));

    return { 
      winnersCount: winners.length, 
      totalPayout: availablePayout, 
      creatorFee: creatorFeeAmount 
    };
  }

  async getEventPoolStats(eventId: number): Promise<{ totalPool: number; yesPool: number; noPool: number; participantsCount: number }> {
    const event = await this.getEventById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const [participantCount] = await db
      .select({ count: count() })
      .from(eventParticipants)
      .where(eq(eventParticipants.eventId, eventId));

    return {
      totalPool: parseFloat(event.eventPool),
      yesPool: parseFloat(event.yesPool),
      noPool: parseFloat(event.noPool),
      participantsCount: participantCount.count,
    };
  }

  // Private event operations
  async requestEventJoin(eventId: number, userId: string, prediction: boolean, amount: number): Promise<EventJoinRequest> {
    const [request] = await db
      .insert(eventJoinRequests)
      .values({
        eventId,
        userId,
        prediction,
        amount: amount.toString(),
      })
      .returning();
    return request;
  }

  async getEventJoinRequests(eventId: number): Promise<(EventJoinRequest & { user: User })[]> {
    return await db
      .select({
        id: eventJoinRequests.id,
        eventId: eventJoinRequests.eventId,
        userId: eventJoinRequests.userId,
        prediction: eventJoinRequests.prediction,
        amount: eventJoinRequests.amount,
        status: eventJoinRequests.status,
        requestedAt: eventJoinRequests.requestedAt,
        respondedAt: eventJoinRequests.respondedAt,
        user: users,
      })
      .from(eventJoinRequests)
      .innerJoin(users, eq(eventJoinRequests.userId, users.id))
      .where(eq(eventJoinRequests.eventId, eventId))
      .orderBy(desc(eventJoinRequests.requestedAt));
  }

  async approveEventJoinRequest(requestId: number): Promise<EventParticipant> {
    const [request] = await db
      .select()
      .from(eventJoinRequests)
      .where(eq(eventJoinRequests.id, requestId));

    if (!request) {
      throw new Error('Join request not found');
    }

    // Create participant
    const participant = await this.joinEvent(
      request.eventId,
      request.userId,
      request.prediction,
      parseFloat(request.amount)
    );

    // Update request status
    await db
      .update(eventJoinRequests)
      .set({ 
        status: 'approved',
        respondedAt: new Date()
      })
      .where(eq(eventJoinRequests.id, requestId));

    return participant;
  }

  async rejectEventJoinRequest(requestId: number): Promise<EventJoinRequest> {
    const [request] = await db
      .update(eventJoinRequests)
      .set({ 
        status: 'rejected',
        respondedAt: new Date()
      })
      .where(eq(eventJoinRequests.id, requestId))
      .returning();
    return request;
  }

  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }


  // Get user profile with stats
  async getAllUsers() {
    const usersResult = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));

    return usersResult.map(user => ({
      ...user,
      status: user.lastLogin && new Date(user.lastLogin).getTime() > Date.now() - 24 * 60 * 60 * 1000 ? 'Online' : 'Offline',
    }));
  }

  async getUserProfile(userId: string, currentUserId: string): Promise<any> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error("User not found");
    }

    // Get user stats
    const [stats] = await db
      .select({
        wins: count(sql`CASE WHEN ${eventParticipants.status} = 'won' THEN 1 END`),
        activeChallenges: count(sql`CASE WHEN ${challenges.status} = 'active' THEN 1 END`),
        totalEarnings: sum(sql`CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END`),
      })
      .from(users)
      .leftJoin(eventParticipants, eq(eventParticipants.userId, users.id))
      .leftJoin(challenges, or(eq(challenges.challenger, users.id), eq(challenges.challenged, users.id)))
      .leftJoin(transactions, eq(transactions.userId, users.id))
      .where(eq(users.id, userId))
      .groupBy(users.id);

    // Check if current user is following this user
    const [followRecord] = await db
      .select()
      .from(friends)
      .where(and(
        eq(friends.requesterId, currentUserId),
        eq(friends.addresseeId, userId),
        eq(friends.status, 'accepted')
      ))
      .limit(1);

    // Get follower and following counts
    const [followerCount] = await db
      .select({ count: count() })
      .from(friends)
      .where(and(
        eq(friends.addresseeId, userId),
        eq(friends.status, 'accepted')
      ));

    const [followingCount] = await db
      .select({ count: count() })
      .from(friends)
      .where(and(
        eq(friends.requesterId, userId),
        eq(friends.status, 'accepted')
      ));

    // Check if there's an active challenge between users
    const [challengeRecord] = await db
      .select()
      .from(challenges)
      .where(and(
        or(
          and(eq(challenges.challenger, currentUserId), eq(challenges.challenged, userId)),
          and(eq(challenges.challenger, userId), eq(challenges.challenged, currentUserId))
        ),
        inArray(challenges.status, ['pending', 'active'])
      ))
      .limit(1);

    return {
      ...user,
      stats: {
        wins: stats?.wins || 0,
        activeChallenges: stats?.activeChallenges || 0,
        totalEarnings: parseFloat(stats?.totalEarnings || '0'),
      },
      isFollowing: !!followRecord,
      followerCount: followerCount?.count || 0,
      followingCount: followingCount?.count || 0,
      hasActiveChallenge: !!challengeRecord,
      challengeStatus: challengeRecord?.status || null,
      isChallengedByMe: challengeRecord?.challenger === currentUserId,
    };
  }

  // Get admin statistics
  async getAdminStats(): Promise<any> {
    const [platformStats] = await db
      .select({
        totalUsers: count(sql`DISTINCT ${users.id}`),
        totalEvents: count(sql`DISTINCT ${events.id}`),
        totalChallenges: count(sql`DISTINCT ${challenges.id}`),
        totalTransactions: count(sql`DISTINCT ${transactions.id}`),
        totalEventPool: sum(events.eventPool),
        totalChallengeStaked: sum(sql`${challenges.amount} * 2`),
        totalPlatformFees: sum(sql`${transactions.amount} * 0.05`),
        activeUsers: count(sql`DISTINCT CASE WHEN ${users.lastLogin} > NOW() - INTERVAL '7 days' THEN ${users.id} END`),
      })
      .from(users)
      .leftJoin(events, eq(events.creatorId, users.id))
      .leftJoin(challenges, or(eq(challenges.challenger, users.id), eq(challenges.challenged, users.id)))
      .leftJoin(transactions, eq(transactions.userId, users.id));

    return platformStats || {
      totalUsers: 0,
      totalEvents: 0,
      totalChallenges: 0,
      totalTransactions: 0,
      totalEventPool: 0,
      totalChallengeStaked: 0,
      totalPlatformFees: 0,
      activeUsers: 0,
    };
  }

  // Get recent users
  async getRecentUsers(limit: number): Promise<any[]> {
    const recentUsers = await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        email: users.email,
        level: users.level,
        points: users.points,
        balance: users.balance,
        streak: users.streak,
        createdAt: users.createdAt,
        lastLogin: users.lastLogin,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit);

    return recentUsers.map(user => ({
      ...user,
      status: user.lastLogin && new Date(user.lastLogin).getTime() > Date.now() - 24 * 60 * 60 * 1000 ? 'Online' : 'Offline',
    }));
  }

  // Get platform activity
  async getPlatformActivity(limit: number): Promise<any[]> {
    const recentActivity = await db
      .select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        description: transactions.description,
        userId: transactions.userId,
        createdAt: transactions.createdAt,
        userFirstName: users.firstName,
        userUsername: users.username,
      })
      .from(transactions)
      .leftJoin(users, eq(users.id, transactions.userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);

    return recentActivity.map(activity => ({
      ...activity,
      userName: activity.userFirstName || activity.userUsername || 'Unknown',
    }));
  }

  // Ban user
  async banUser(userId: string, reason: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        status: 'banned',
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    // Create admin log entry
    await db.insert(transactions).values({
      userId,
      type: 'admin_action',
      amount: '0',
      description: `User banned - Reason: ${reason}`,
      status: 'completed',
      createdAt: new Date()
    });

    return updatedUser;
  }

  // Unban user
  async unbanUser(userId: string, reason: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        status: 'active',
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    // Create admin log entry
    await db.insert(transactions).values({
      userId,
      type: 'admin_action',
      amount: '0',
      description: `User unbanned - Reason: ${reason}`,
      status: 'completed',
      createdAt: new Date()
    });

    return updatedUser;
  }

  // Adjust user balance
  async adjustUserBalance(userId: string, amount: number, reason: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        balance: sql`${users.balance} + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    // Create transaction record
    await db.insert(transactions).values({
      userId,
      type: amount > 0 ? 'admin_credit' : 'admin_debit',
      amount: Math.abs(amount).toString(),
      description: `Admin balance adjustment - Reason: ${reason}`,
      status: 'completed',
      createdAt: new Date()
    });

    return updatedUser;
  }

  // Set user admin status
  async setUserAdminStatus(userId: string, isAdmin: boolean, reason: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        isAdmin,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    // Create admin log entry
    await db.insert(transactions).values({
      userId,
      type: 'admin_action',
      amount: '0',
      description: `Admin status ${isAdmin ? 'granted' : 'revoked'} - Reason: ${reason}`,
      status: 'completed',
      createdAt: new Date()
    });

    return updatedUser;
  }

  // Send admin message
  async sendAdminMessage(userId: string, message: string, reason: string): Promise<any> {
    // Create notification
    await db.insert(notifications).values({
      userId,
      type: 'admin_message',
      title: 'Message from Admin',
      message,
      createdAt: new Date()
    });

    // Create admin log entry
    await db.insert(transactions).values({
      userId,
      type: 'admin_action',
      amount: '0',
      description: `Admin message sent - Reason: ${reason}`,
      status: 'completed',
      createdAt: new Date()
    });

    return { success: true, message: 'Admin message sent successfully' };
  }

  async checkDailyLogin(userId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if user has already logged in today
    const todayLogin = await db
      .select()
      .from(dailyLogins)
      .where(and(
        eq(dailyLogins.userId, userId),
        sql`DATE(${dailyLogins.date}) = ${today.toISOString().split('T')[0]}`
      ))
      .limit(1);

    if (todayLogin.length > 0) {
      return todayLogin[0]; // Already logged in today
    }

    // Get last login to determine streak
    const lastLogin = await db
      .select()
      .from(dailyLogins)
      .where(eq(dailyLogins.userId, userId))
      .orderBy(sql`${dailyLogins.date} DESC`)
      .limit(1);

    let currentStreak = 1;
    if (lastLogin.length > 0) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const lastLoginDate = new Date(lastLogin[0].date);
      lastLoginDate.setHours(0, 0, 0, 0);

      if (lastLoginDate.getTime() === yesterday.getTime()) {
        currentStreak = lastLogin[0].streak + 1; // Continue streak
      } else {
        currentStreak = 1; // Reset streak
      }
    }

    // Calculate points (base 50 + streak bonus, max 200 bonus)
    const basePoints = 50;
    const streakBonus = Math.min(currentStreak * 10, 200);
    const pointsEarned = basePoints + streakBonus;

    // Create today's login record
    const [newLogin] = await db
      .insert(dailyLogins)
      .values({
        userId,
        date: today,
        streak: currentStreak,
        pointsEarned,
        claimed: false
      })
      .returning();

    // If first time user, also create welcome notification
    const userCreatedToday = await db
      .select()
      .from(users)
      .where(and(
        eq(users.id, userId),
        sql`DATE(${users.createdAt}) = ${today.toISOString().split('T')[0]}`
      ))
      .limit(1);

    if (userCreatedToday.length > 0) {
      // Create welcome notification for new users
      await this.createNotification({
        userId,
        type: 'welcome',
        title: '🎉 Welcome to BetChat!',
        message: 'You received 1000 points for joining! Start betting and challenging friends.',
        data: { points: 1000, type: 'welcome_bonus' }
      });

      // Check if user was referred
      const user = userCreatedToday[0];
      if (user.referredBy) {
        // Find referrer and create referral notification
        const referrer = await this.getUser(user.referredBy);
        if (referrer) {
          await this.createNotification({
            userId: user.referredBy,
            type: 'referral_reward',
            title: '💰 Referral Bonus!',
            message: `You earned 500 points for referring @${user.firstName || user.username || 'a new user'}!`,
            data: { 
              points: 500, 
              referredUserId: userId,
              referredUserName: user.firstName || user.username,
              type: 'referral_bonus'
            }
          });

          // Add referral points to referrer
          await db
            .update(users)
            .set({ 
              points: sql`${users.points} + 500`,
              updatedAt: new Date()
            })
            .where(eq(users.id, user.referredBy));

          // Create transaction for referrer
          await this.createTransaction({
            userId: user.referredBy,
            type: 'referral_bonus',
            amount: '500',
            description: `Referral bonus for ${user.firstName || user.username || 'new user'}`,
            status: 'completed'
          });
        }
      }
    }

    return newLogin;
  }

  // Get user created events
  async getUserCreatedEvents(userId: string): Promise<any[]> {
    const createdEvents = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        category: events.category,
        eventPool: events.eventPool,
        status: events.status,
        endDate: events.endDate,
        createdAt: events.createdAt,
        participantCount: count(eventParticipants.id),
      })
      .from(events)
      .leftJoin(eventParticipants, eq(eventParticipants.eventId, events.id))
      .where(eq(events.creatorId, userId))
      .groupBy(events.id)
      .orderBy(desc(events.createdAt));

    return createdEvents;
  }

  // Get user joined events
  async getUserJoinedEvents(userId: string): Promise<any[]> {
    const joinedEvents = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        category: events.category,
        eventPool: events.eventPool,
        status: events.status,
        endDate: events.endDate,
        createdAt: events.createdAt,
        participantAmount: eventParticipants.amount,
        participantStatus: eventParticipants.status,
        prediction: eventParticipants.prediction,
        joinedAt: eventParticipants.joinedAt,
      })
      .from(eventParticipants)
      .innerJoin(events, eq(events.id, eventParticipants.eventId))
      .where(eq(eventParticipants.userId, userId))
      .orderBy(desc(eventParticipants.joinedAt));

    return joinedEvents;
  }

  // Admin Management Functions
  async deleteEvent(eventId: number) {
    // Delete related records first
    await db.delete(eventParticipants).where(eq(eventParticipants.eventId, eventId));
    await db.delete(eventMessages).where(eq(eventMessages.eventId, eventId));
    await db.delete(messageReactions).where(eq(messageReactions.messageId, sql`(SELECT id FROM event_messages WHERE event_id = ${eventId})`));

    // Delete the event
    await db.delete(events).where(eq(events.id, eventId));

    console.log(`Event ${eventId} deleted by admin`);
  }

  async toggleEventChat(eventId: number, enabled: boolean) {
    await db.update(events)
      .set({ 
        chatEnabled: enabled,
        updatedAt: new Date()
      })
      .where(eq(events.id, eventId));

    console.log(`Event ${eventId} chat ${enabled ? 'enabled' : 'disabled'} by admin`);
  }

  async deleteChallenge(challengeId: number) {
    // Delete related records first
    // await db.delete(challengeParticipants).where(eq(challengeParticipants.challengeId, challengeId)); // Assuming you have a challengeParticipants table

    // Delete the challenge
    await db.delete(challenges).where(eq(challenges.id, challengeId));

    console.log(`Challenge ${challengeId} deleted by admin`);
  }

  // Admin Functions
  async getAdminUsers() {
    const admins = await db.select({
      id: users.id,
      username: users.username,
      firstName: users.firstName,
      email: users.email,
      level: users.level,
      points: users.points,
      createdAt: users.createdAt,
      lastLogin: users.lastLogin,
      status: users.status
    }).from(users).where(eq(users.isAdmin, true));

    return admins;
  }

  async getAdminStats() {
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    const totalEvents = await db.select({ count: sql<number>`count(*)` }).from(events);
    const totalChallenges = await db.select({ count: sql<number>`count(*)` }).from(challenges);

    // Calculate revenue from completed events and challenges
    const eventRevenue = await db.select({
      totalCreatorFees: sql<number>`COALESCE(SUM(CAST(creator_fee AS DECIMAL)), 0)`
    }).from(events).where(eq(events.status, 'completed'));

    const challengeRevenue = await db.select({
      totalPlatformFees: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL) * 2 * 0.05), 0)`
    }).from(challenges).where(eq(challenges.status, 'completed'));

    const totalRevenue = (eventRevenue[0]?.totalCreatorFees || 0) + (challengeRevenue[0]?.totalPlatformFees || 0);

    return {
      totalUsers: totalUsers[0].count,
      totalEvents: totalEvents[0].count,
      totalChallenges: totalChallenges[0].count,
      dailyActiveUsers: 0, // TODO: Implement proper DAU calculation
      pendingPayouts: 0, // TODO: Implement pending payouts count
      totalRevenue: totalRevenue,
      totalNotifications: 0, // TODO: Implement notifications count
    };
  }

  // Platform Settings
  async getPlatformSettings(): Promise<PlatformSettings> {
    const [settings] = await db.select().from(platformSettings).limit(1);

    if (!settings) {
      // Create default settings if none exist
      const [defaultSettings] = await db.insert(platformSettings).values({}).returning();
      return defaultSettings;
    }

    return settings;
  }

  async updatePlatformSettings(settingsUpdate: Partial<PlatformSettings>): Promise<PlatformSettings> {
    const existingSettings = await this.getPlatformSettings();

    const [updatedSettings] = await db
      .update(platformSettings)
      .set({
        ...settingsUpdate,
        updatedAt: new Date(),
      })
      .where(eq(platformSettings.id, existingSettings.id))
      .returning();

    return updatedSettings;
  }

  // Advanced Admin Tools
  async addEventFunds(eventId: number, amount: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Add funds to event pool
      await tx
        .update(events)
        .set({
          eventPool: sql`${events.eventPool} + ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(events.id, eventId));

      // Create transaction record
      await tx.insert(transactions).values({
        userId: 'admin',
        type: 'admin_fund',
        amount: amount.toString(),
        description: `Admin added ₦${amount} to event ${eventId}`,
        status: 'completed',
      });
    });
  }

  async giveUserPoints(userId: string, points: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Add points to user
      await tx
        .update(users)
        .set({
          points: sql`${users.points} + ${points}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Create transaction record
      await tx.insert(transactions).values({
        userId: userId,
        type: 'admin_points',
        amount: points.toString(),
        description: `Admin gave ${points} points`,
        status: 'completed',
      });
    });
  }

  async updateEventCapacity(eventId: number, additionalSlots: number): Promise<void> {
    await db
      .update(events)
      .set({
        maxParticipants: sql`${events.maxParticipants} + ${additionalSlots}`,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId));
  }

  async broadcastMessage(message: string, type: string): Promise<void> {
    // Get all users to broadcast to
    const allUsers = await db.select({ id: users.id }).from(users);

    // Create notifications for all users
    const notificationData = allUsers.map(user => ({
      userId: user.id,
      type: 'broadcast' as const,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Message`,
      message: message,
      data: { broadcastType: type },
    }));

    await db.insert(notifications).values(notificationData);
  }

  // Event lifecycle notification methods
  async notifyEventStarting(eventId: number): Promise<void> {
    const event = await this.getEventById(eventId);
    if (!event) return;

    const participants = await this.getEventParticipants(eventId);

    for (const participant of participants) {
      await this.createNotification({
        userId: participant.userId,
        type: 'event_starting',
        title: '🏁 Event Starting Soon',
        message: `The event "${event.title}" is starting in 1 hour!`,
        data: { 
          eventId: eventId,
          eventTitle: event.title,
          startTime: event.endDate
        },
      });
    }

    // Notify creator
    await this.createNotification({
      userId: event.creatorId,
      type: 'event_starting',
      title: '🏁 Your Event is Starting Soon',
      message: `Your event "${event.title}" is starting in 1 hour!`,
      data: { 
        eventId: eventId,
        eventTitle: event.title,
        startTime: event.endDate
      },
    });
  }

  async notifyEventEnding(eventId: number): Promise<void> {
    const event = await this.getEventById(eventId);
    if (!event) return;

    const participants = await this.getEventParticipants(eventId);

    for (const participant of participants) {
      await this.createNotification({
        userId: participant.userId,
        type: 'event_ending',
        title: '⏰ Event Ending Soon',
        message: `The event "${event.title}" is ending in 1 hour! Make sure your prediction is locked in.`,
        data: { 
          eventId: eventId,
          eventTitle: event.title,
          endTime: event.endDate,
          prediction: participant.prediction ? 'YES' : 'NO',
          amount: parseFloat(participant.amount)
        },
      });
    }

    // Notify creator
    await this.createNotification({
      userId: event.creatorId,
      type: 'event_ending',
      title: '⏰ Your Event is Ending Soon',
      message: `Your event "${event.title}" is ending in 1 hour! Results will need to be set soon.`,
      data: { 
        eventId: eventId,
        eventTitle: event.title,
        endTime: event.endDate
      },
    });
  }

  async notifyFundsReleased(userId: string, eventId: number, amount: number, isWinner: boolean): Promise<void> {
    const event = await this.getEventById(eventId);
    if (!event) return;

    if (isWinner) {
      await this.createNotification({
        userId: userId,
        type: 'funds_released',
        title: '🎉 You Won!',
        message: `Congratulations! You won ₦${amount.toLocaleString()} from "${event.title}". Funds have been released to your wallet.`,
        data: { 
          eventId: eventId,
          eventTitle: event.title,
          amount: amount,
          isWinner: true
        },
      });
    } else {
      await this.createNotification({
        userId: userId,
        type: 'funds_released',
        title: '😔 Event Results',
        message: `The event "${event.title}" has concluded. Better luck next time!`,
        data: { 
          eventId: eventId,
          eventTitle: event.title,
          amount: 0,
          isWinner: false
        },
      });
    }
  }

  // Missing admin functions
  async getAdminNotifications(limit: number): Promise<any[]> {
    return await db.select().from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async broadcastNotification(data: any): Promise<any> {
    // Get all users if no target specified
    const targetUsers = data.targetUserIds || 
      (await db.select({ id: users.id }).from(users)).map(u => u.id);

    const notificationData = targetUsers.map((userId: string) => ({
      userId: userId,
      type: data.type || 'admin_announcement',
      title: data.title,
      message: data.message,
    }));

    await db.insert(notifications).values(notificationData);
    return { success: true, count: notificationData.length };
  }

  async searchUsers(query: string, limit: number): Promise<any[]> {
    return await db.select().from(users)
      .where(sql`${users.username} ILIKE ${`%${query}%`} OR ${users.firstName} ILIKE ${`%${query}%`}`)
      .limit(limit);
  }

  // Push notification subscription methods
  async savePushSubscription(userId: string, subscription: any): Promise<void> {
    await db.insert(pushSubscriptions).values({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: subscription.userAgent || null,
    });
  }

  async getPushSubscriptions(userId: string): Promise<any[]> {
    const subscriptions = await db
      .select({
        endpoint: pushSubscriptions.endpoint,
        p256dh: pushSubscriptions.p256dh,
        auth: pushSubscriptions.auth,
      })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    return subscriptions.map(sub => ({
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    }));
  }

  async removePushSubscription(endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }
}

export const storage = new DatabaseStorage();