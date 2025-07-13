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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, count, sum, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations - Required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, updates: Partial<User>): Promise<User>;
  updateNotificationPreferences(userId: string, preferences: any): Promise<void>;

  // Event operations
  getEvents(limit?: number): Promise<Event[]>;
  getEventById(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, updates: Partial<Event>): Promise<Event>;
  joinEvent(eventId: number, userId: string, prediction: boolean, amount: number): Promise<EventParticipant>;
  getEventParticipants(eventId: number): Promise<EventParticipant[]>;
  getEventMessages(eventId: number, limit?: number): Promise<any[]>;
  createEventMessage(eventId: number, userId: string, message: string, replyToId?: string, mentions?: string[]): Promise<EventMessage>;
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

  // Friend operations
  getFriends(userId: string): Promise<(Friend & { requester: User, addressee: User })[]>;
  sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friend>;
  acceptFriendRequest(id: number): Promise<Friend>;

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
    const [participant] = await db
      .insert(eventParticipants)
      .values({
        eventId,
        userId,
        prediction,
        amount: amount.toString(),
      })
      .returning();

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

  async createEventMessage(eventId: number, userId: string, message: string, replyToId?: string, mentions?: string[]): Promise<EventMessage> {
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
    return newMessage;
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
          lastName: sql`challenged_user.profile_image_url`,
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
    const [newChallenge] = await db.insert(challenges).values(challenge).returning();
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

  async getUserBalance(userId: string): Promise<{ balance: number }> {
    // Calculate balance from all transactions
    const [result] = await db
      .select({
        totalBalance: sql<number>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL)), 0)`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.status, 'completed')
        )
      );

    return { balance: result?.totalBalance || 0 };
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
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();

    // Update user balance for deposit/withdrawal transactions
    if (transaction.type === 'deposit' || transaction.type === 'withdrawal' || transaction.type === 'win') {
      const amount = parseFloat(transaction.amount);
      if (!isNaN(amount)) {
        await db
          .update(users)
          .set({
            balance: sql`COALESCE(${users.balance}, 0) + ${amount}`,
            updatedAt: new Date(),
          })
          .where(eq(users.id, transaction.userId));
      }
    }

    return newTransaction;
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
    
    for (const winner of winners) {
      const winnerBet = parseFloat(winner.amount);
      const winnerShare = winnerBet / totalWinnerBets;
      const payout = winnerBet + (availablePayout - totalWinnerBets) * winnerShare;
      
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

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }
}

export const storage = new DatabaseStorage();