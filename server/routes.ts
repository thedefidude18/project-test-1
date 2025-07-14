
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import Pusher from "pusher";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { db } from "./db";
import { insertEventSchema, insertChallengeSchema, insertNotificationSchema } from "@shared/schema";
import { and, eq } from "drizzle-orm";
import {
  users,
  events,
  bets,
  messages,
  userAchievements,
  challenges,
  challengeParticipants,
  notifications,
  reactions,
  userFeedback,
  walletBalances,
  walletTransactions,
  followers,
  dailyLogins,
} from "../shared/schema";
import { sql } from "drizzle-orm";
import crypto from "crypto";
import { createTelegramSync, getTelegramSync } from "./telegramSync";

// Initialize Pusher
const pusher = new Pusher({
  appId: "1553294",
  key: "decd2cca5e39cf0cbcd4",
  secret: "1dd966e56c465ea285d9",
  cluster: "mt1",
  useTLS: true,
});

// Initialize Telegram sync service
const telegramSync = createTelegramSync(pusher);
if (telegramSync) {
  telegramSync.initialize().catch((error) => {
    console.error("❌ Failed to initialize Telegram sync:", error);
  });
  console.log("🚀 Telegram sync service created successfully");
} else {
  console.log("⚠️ Telegram sync service not available - check environment variables");
}

interface AuthenticatedRequest extends Request {
  user: {
    claims: {
      sub: string;
      email?: string;
      first_name?: string;
      last_name?: string;
      profile_image_url?: string;
    };
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check and create daily login record
      await storage.checkDailyLogin(userId);
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Event routes
  app.get('/api/events', async (req, res) => {
    try {
      const events = await storage.getEvents(20);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get('/api/events/:id', async (req, res) => {
    try {
      const event = await storage.getEventById(parseInt(req.params.id));
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post('/api/events', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log("Creating event with data:", req.body);
      console.log("User ID:", userId);

      // Validate required fields
      if (!req.body.title || !req.body.category || !req.body.entryFee || !req.body.endDate) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Convert entryFee to proper decimal format
      const entryFee = parseFloat(req.body.entryFee);
      if (isNaN(entryFee) || entryFee <= 0) {
        return res.status(400).json({ message: "Invalid entry fee" });
      }

      // Validate end date
      const endDate = new Date(req.body.endDate);
      if (endDate <= new Date()) {
        return res.status(400).json({ message: "End date must be in the future" });
      }

      const eventData = {
        title: req.body.title,
        description: req.body.description || null,
        category: req.body.category,
        entryFee: entryFee.toString(),
        endDate: endDate,
        creatorId: userId,
        status: 'active',
        isPrivate: req.body.isPrivate || false,
        maxParticipants: req.body.maxParticipants || 100,
      };

      console.log("Parsed event data:", eventData);

      const event = await storage.createEvent(eventData);
      console.log("Created event:", event);

      res.json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create event" });
      }
    }
  });

  app.post('/api/events/:id/join', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = parseInt(req.params.id);
      const { prediction, amount } = req.body;

      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Check user balance
      const balance = await storage.getUserBalance(userId);
      if (balance.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Check if event is private
      if (event.isPrivate) {
        // Create join request for private events
        const joinRequest = await storage.requestEventJoin(eventId, userId, prediction, amount);

        // Create notification for event creator
        await storage.createNotification({
          userId: event.creatorId,
          type: 'event_join_request',
          title: 'New Event Join Request',
          message: `${req.user.claims.first_name || 'Someone'} wants to join your private event: ${event.title}`,
          data: { eventId: eventId, requestId: joinRequest.id },
        });

        // Create notification for user about pending request
        await storage.createNotification({
          userId,
          type: 'event_join_pending',
          title: '⏳ Join Request Submitted',
          message: `Your request to join "${event.title}" is pending approval. Funds will be locked once approved.`,
          data: { 
            eventId: eventId, 
            amount: amount,
            prediction: prediction ? 'YES' : 'NO',
            eventTitle: event.title
          },
        });

        return res.json({ message: "Join request sent to event creator", request: joinRequest });
      }

      const participant = await storage.joinEvent(eventId, userId, prediction, amount);

      // Create transaction record for escrow
      await storage.createTransaction({
        userId,
        type: 'event_escrow',
        amount: `-${amount}`,
        description: `Funds locked in escrow for event: ${event.title}`,
        relatedId: eventId,
        status: 'completed',
      });

      // Create comprehensive notifications
      await storage.createNotification({
        userId,
        type: 'funds_locked',
        title: '🔒 Funds Locked in Escrow',
        message: `₦${amount.toLocaleString()} locked for your ${prediction ? 'YES' : 'NO'} prediction on "${event.title}". Funds will be released when the event ends.`,
        data: { 
          eventId: eventId,
          amount: amount,
          prediction: prediction ? 'YES' : 'NO',
          eventTitle: event.title,
          eventEndDate: event.endDate,
          type: 'escrow_lock'
        },
      });

      // Notify event creator about new participant
      await storage.createNotification({
        userId: event.creatorId,
        type: 'event_participant_joined',
        title: '🎯 New Event Participant',
        message: `${req.user.claims.first_name || 'Someone'} joined your event "${event.title}" with a ${prediction ? 'YES' : 'NO'} prediction!`,
        data: { 
          eventId: eventId,
          participantId: userId,
          amount: amount,
          prediction: prediction ? 'YES' : 'NO',
          eventTitle: event.title
        },
      });

      // Send real-time notifications via Pusher
      await pusher.trigger(`user-${userId}`, 'funds-locked', {
        title: '🔒 Funds Locked in Escrow',
        message: `₦${amount.toLocaleString()} locked for your ${prediction ? 'YES' : 'NO'} prediction on "${event.title}"`,
        eventId: eventId,
        type: 'funds_locked',
      });

      await pusher.trigger(`user-${event.creatorId}`, 'participant-joined', {
        title: '🎯 New Event Participant',
        message: `${req.user.claims.first_name || 'Someone'} joined your event "${event.title}"`,
        eventId: eventId,
        type: 'participant_joined',
      });

      res.json(participant);
    } catch (error) {
      console.error("Error joining event:", error);
      res.status(500).json({ message: "Failed to join event" });
    }
  });

  app.get('/api/events/:id/messages', async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const messages = await storage.getEventMessages(eventId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching event messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/events/:id/messages', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = parseInt(req.params.id);
      const { message, replyToId, mentions } = req.body;

      const newMessage = await storage.createEventMessage(eventId, userId, message, replyToId, mentions);

      // Broadcast new message via Pusher
      await pusher.trigger(`event-${eventId}`, 'new-message', {
        message: newMessage,
        eventId: eventId,
        userId: userId,
      });

      // Create notifications for mentioned users
      if (mentions && mentions.length > 0) {
        for (const mentionedUsername of mentions) {
          const mentionedUser = await storage.getUserByUsername(mentionedUsername);
          if (mentionedUser && mentionedUser.id !== userId) {
            const notification = await storage.createNotification({
              userId: mentionedUser.id,
              type: 'mention',
              title: 'You were mentioned',
              message: `${req.user.claims.first_name || 'Someone'} mentioned you in an event chat`,
              data: { 
                eventId: eventId, 
                messageId: newMessage.id,
                mentionedBy: userId,
                eventTitle: 'Event Chat'
              },
            });

            // Send notification via Pusher
            await pusher.trigger(`user-${mentionedUser.id}`, 'event-notification', {
              title: 'You were mentioned',
              message: `${req.user.claims.first_name || 'Someone'} mentioned you in an event chat`,
              eventId: eventId,
              type: 'mention',
            });
          }
        }
      }

      // Create notification for replied user
      if (replyToId) {
        const repliedMessage = await storage.getEventMessageById(replyToId);
        if (repliedMessage && repliedMessage.userId !== userId) {
          const notification = await storage.createNotification({
            userId: repliedMessage.userId,
            type: 'reply',
            title: 'Someone replied to your message',
            message: `${req.user.claims.first_name || 'Someone'} replied to your message`,
            data: { 
              eventId: eventId, 
              messageId: newMessage.id,
              repliedBy: userId,
              originalMessageId: replyToId
            },
          });

          // Send notification via Pusher
          await pusher.trigger(`user-${repliedMessage.userId}`, 'event-notification', {
            title: 'Someone replied to your message',
            message: `${req.user.claims.first_name || 'Someone'} replied to your message`,
            eventId: eventId,
            type: 'reply',
          });
        }
      }

      res.json(newMessage);
    } catch (error) {
      console.error("Error creating event message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.post('/api/events/:id/messages/:messageId/react', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = parseInt(req.params.id);
      const messageId = req.params.messageId;
      const { emoji } = req.body;

      const reaction = await storage.toggleMessageReaction(messageId, userId, emoji);

      // Get updated reaction summary for the message
      const message = await storage.getEventMessageById(messageId);
      const updatedReactions = await storage.getMessageReactions(messageId);

      // Broadcast reaction update via Pusher with complete reaction data
      await pusher.trigger(`event-${eventId}`, 'reaction-update', {
        messageId: messageId,
        reactions: updatedReactions,
        userId: userId,
        action: reaction.action,
        emoji: emoji,
        timestamp: new Date().toISOString(),
      });

      res.json({ 
        ...reaction, 
        messageId: messageId,
        reactions: updatedReactions,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error reacting to message:", error);
      res.status(500).json({ message: "Failed to react to message" });
    }
  });

  app.get('/api/events/:id/participants', async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const participants = await storage.getEventParticipantsWithUsers(eventId);
      res.json(participants);
    } catch (error) {
      console.error("Error fetching event participants:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });

  // Event Pool Management Routes
  app.get('/api/events/:id/stats', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const stats = await storage.getEventPoolStats(eventId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching event stats:", error);
      res.status(500).json({ message: "Failed to fetch event stats" });
    }
  });

  // Admin Route: Set event result and trigger payout
  app.post('/api/admin/events/:id/result', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = parseInt(req.params.id);
      const { result } = req.body; // true for YES, false for NO

      // Log admin action for audit trail
      console.log(`Admin ${userId} setting result for event ${eventId}: ${result ? 'YES' : 'NO'}`);

      // Validate event exists and is ready for payout
      const existingEvent = await storage.getEventById(eventId);
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      if (existingEvent.adminResult !== null) {
        return res.status(400).json({ message: "Event result already set" });
      }

      const event = await storage.adminSetEventResult(eventId, result);
      const payoutResult = await storage.processEventPayout(eventId);

      // Log payout for audit trail
      console.log(`Event ${eventId} payout processed:`, {
        winnersCount: payoutResult.winnersCount,
        totalPayout: payoutResult.totalPayout,
        creatorFee: payoutResult.creatorFee,
        processedBy: userId,
        timestamp: new Date().toISOString()
      });

      // Send real-time notification to participants
      await pusher.trigger(`event-${eventId}`, 'event-resolved', {
        eventId,
        result: result ? 'YES' : 'NO',
        winnersCount: payoutResult.winnersCount,
        totalPayout: payoutResult.totalPayout,
        timestamp: new Date().toISOString()
      });

      res.json({ 
        event, 
        payout: payoutResult,
        message: `Event result set to ${result ? 'YES' : 'NO'}. Payout processed: ${payoutResult.winnersCount} winners received ₦${payoutResult.totalPayout.toLocaleString()} total, ₦${payoutResult.creatorFee.toLocaleString()} creator fee.`
      });
    } catch (error) {
      console.error("Error setting event result:", error);
      res.status(500).json({ message: error.message || "Failed to set event result" });
    }
  });

  // Private Event Management Routes
  app.get('/api/events/:id/join-requests', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = parseInt(req.params.id);

      // Check if user is the event creator
      const event = await storage.getEventById(eventId);
      if (!event || event.creatorId !== userId) {
        return res.status(403).json({ message: "Only event creator can view join requests" });
      }

      const requests = await storage.getEventJoinRequests(eventId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching join requests:", error);
      res.status(500).json({ message: "Failed to fetch join requests" });
    }
  });

  app.post('/api/events/join-requests/:id/approve', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = parseInt(req.params.id);

      // TODO: Add validation that user is the event creator

      const participant = await storage.approveEventJoinRequest(requestId);

      // Create notification for requester
      await storage.createNotification({
        userId: participant.userId,
        type: 'event_join_approved',
        title: 'Event Join Request Approved',
        message: `Your request to join the event has been approved!`,
        data: { eventId: participant.eventId },
      });

      res.json(participant);
    } catch (error) {
      console.error("Error approving join request:", error);
      res.status(500).json({ message: "Failed to approve join request" });
    }
  });

  app.post('/api/events/join-requests/:id/reject', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = parseInt(req.params.id);

      // TODO: Add validation that user is the event creator

      const rejectedRequest = await storage.rejectEventJoinRequest(requestId);

      // Create notification for requester
      await storage.createNotification({
        userId: rejectedRequest.userId,
        type: 'event_join_rejected',
        title: 'Event Join Request Rejected',
        message: `Your request to join the event has been rejected.`,
        data: { eventId: rejectedRequest.eventId },
      });

      res.json(rejectedRequest);
    } catch (error) {
      console.error("Error rejecting join request:", error);
      res.status(500).json({ message: "Failed to reject join request" });
    }
  });

  // Challenge routes
  app.get('/api/challenges', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const challenges = await storage.getChallenges(userId);
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });

  app.post('/api/challenges', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Prepare data for validation
      const dataToValidate = {
        ...req.body,
        challenger: userId,
        amount: req.body.amount.toString(), // Ensure it's a string for decimal field
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined // Convert string to Date
      };
      
      console.log('Challenge data to validate:', dataToValidate);
      
      const challengeData = insertChallengeSchema.parse(dataToValidate);
      const challenge = await storage.createChallenge(challengeData);

      // Get challenger and challenged user info
      const challenger = await storage.getUser(userId);
      const challenged = await storage.getUser(challenge.challenged);

      // Create notification for challenged user
      const challengedNotification = await storage.createNotification({
        userId: challenge.challenged,
        type: 'challenge',
        title: '🎯 New Challenge Request',
        message: `${challenger?.firstName || challenger?.username || 'Someone'} challenged you to "${challenge.title}"`,
        data: { 
          challengeId: challenge.id,
          challengerName: challenger?.firstName || challenger?.username,
          challengeTitle: challenge.title,
          amount: challenge.amount,
          type: challenge.type
        },
      });

      // Create notification for challenger (confirmation)
      const challengerNotification = await storage.createNotification({
        userId: userId,
        type: 'challenge_sent',
        title: '🚀 Challenge Sent',
        message: `Your challenge "${challenge.title}" was sent to ${challenged?.firstName || challenged?.username}`,
        data: { 
          challengeId: challenge.id,
          challengedName: challenged?.firstName || challenged?.username,
          challengeTitle: challenge.title,
          amount: challenge.amount,
          type: challenge.type
        },
      });

      // Send instant real-time notifications via Pusher
      try {
        await pusher.trigger(`user-${challenge.challenged}`, 'challenge-received', {
          id: challengedNotification.id,
          type: 'challenge_received',
          title: '🎯 Challenge Received!',
          message: `${challenger?.firstName || challenger?.username || 'Someone'} challenged you to "${challenge.title}"`,
          challengerName: challenger?.firstName || challenger?.username || 'Someone',
          challengeTitle: challenge.title,
          amount: parseFloat(challenge.amount),
          challengeId: challenge.id,
          data: challengedNotification.data,
          timestamp: new Date().toISOString(),
        });

        await pusher.trigger(`user-${userId}`, 'challenge-sent', {
          id: challengerNotification.id,
          type: 'challenge_sent',
          title: '🚀 Challenge Sent',
          message: `Your challenge "${challenge.title}" was sent to ${challenged?.firstName || challenged?.username}`,
          data: challengerNotification.data,
          timestamp: new Date().toISOString(),
        });
      } catch (pusherError) {
        console.error("Error sending Pusher notifications:", pusherError);
      }

      res.json(challenge);
    } catch (error) {
      console.error("Error creating challenge:", error);
      res.status(500).json({ message: "Failed to create challenge" });
    }
  });

  app.patch('/api/challenges/:id', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      const updates = req.body;
      const challenge = await storage.updateChallenge(challengeId, updates);
      res.json(challenge);
    } catch (error) {
      console.error("Error updating challenge:", error);
      res.status(500).json({ message: "Failed to update challenge" });
    }
  });

  app.post('/api/challenges/:id/accept', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      const challenge = await storage.acceptChallenge(challengeId, userId);

      // Get user info for notifications
      const challenger = await storage.getUser(challenge.challenger);
      const challenged = await storage.getUser(challenge.challenged);

      // Create notifications for both users
      await storage.createNotification({
        userId: challenge.challenger,
        type: 'challenge_accepted',
        title: '🎯 Challenge Accepted!',
        message: `${challenged?.firstName || challenged?.username} accepted your challenge "${challenge.title}"! The challenge is now active.`,
        data: { 
          challengeId: challengeId,
          challengeTitle: challenge.title,
          amount: parseFloat(challenge.amount),
          acceptedBy: challenged?.firstName || challenged?.username
        },
      });

      await storage.createNotification({
        userId: challenge.challenged,
        type: 'challenge_active',
        title: '🔒 Challenge Active',
        message: `Your stake of ₦${parseFloat(challenge.amount).toLocaleString()} has been escrowed for challenge "${challenge.title}". Good luck!`,
        data: { 
          challengeId: challengeId,
          challengeTitle: challenge.title,
          amount: parseFloat(challenge.amount)
        },
      });

      // Send real-time notifications via Pusher
      try {
        await pusher.trigger(`user-${challenge.challenger}`, 'challenge-accepted', {
          id: Date.now(),
          type: 'challenge_accepted',
          title: '🎯 Challenge Accepted!',
          message: `${challenged?.firstName || challenged?.username} accepted your challenge "${challenge.title}"!`,
          data: { challengeId: challengeId },
          timestamp: new Date().toISOString(),
        });

        await pusher.trigger(`user-${challenge.challenged}`, 'challenge-active', {
          id: Date.now(),
          type: 'challenge_active',
          title: '🔒 Challenge Active',
          message: `Challenge "${challenge.title}" is now active! Your funds are secured in escrow.`,
          data: { challengeId: challengeId },
          timestamp: new Date().toISOString(),
        });
      } catch (pusherError) {
        console.error("Error sending Pusher notifications:", pusherError);
      }

      res.json(challenge);
    } catch (error) {
      console.error("Error accepting challenge:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to accept challenge" });
    }
  });

  app.get('/api/challenges/:id/messages', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      // Verify user is part of the challenge
      const challenge = await storage.getChallengeById(challengeId);
      if (!challenge || (challenge.challenger !== userId && challenge.challenged !== userId)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getChallengeMessages(challengeId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching challenge messages:", error);
      res.status(500).json({ message: "Failed to fetch challenge messages" });
    }
  });

  app.post('/api/challenges/:id/messages', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { message, type = 'text', evidence } = req.body;

      // Verify user is part of the challenge
      const challenge = await storage.getChallengeById(challengeId);
      if (!challenge || (challenge.challenger !== userId && challenge.challenged !== userId)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const newMessage = await storage.createChallengeMessage(challengeId, userId, message);

      // Get user info for real-time message
      const user = await storage.getUser(userId);
      const messageWithUser = {
        ...newMessage,
        user: {
          id: user?.id,
          username: user?.username,
          firstName: user?.firstName,
          profileImageUrl: user?.profileImageUrl
        }
      };

      // Send real-time message to both participants
      const otherUserId = challenge.challenger === userId ? challenge.challenged : challenge.challenger;

      try {
        await pusher.trigger(`challenge-${challengeId}`, 'new-message', {
          message: messageWithUser,
          timestamp: new Date().toISOString(),
        });

        // Send notification to other participant
        await storage.createNotification({
          userId: otherUserId,
          type: 'challenge_message',
          title: '💬 New Challenge Message',
          message: `${user?.firstName || user?.username} sent a message in challenge "${challenge.title}"`,
          data: { 
            challengeId: challengeId,
            challengeTitle: challenge.title,
            messagePreview: message.substring(0, 50) + (message.length > 50 ? '...' : '')
          },
        });
      } catch (pusherError) {
        console.error("Error sending real-time message:", pusherError);
      }

      res.json(messageWithUser);
    } catch (error) {
      console.error("Error creating challenge message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Friend routes
  app.get('/api/friends', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.post('/api/friends/request', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const requesterId = req.user.claims.sub;
      const { addresseeId } = req.body;

      const friendRequest = await storage.sendFriendRequest(requesterId, addresseeId);

      // Get requester info
      const requester = await storage.getUser(requesterId);

      // Create notification
      await storage.createNotification({
        userId: addresseeId,
        type: 'friend_request',
        title: '👋 Friend Request',
        message: `${requester?.firstName || requester?.username || 'Someone'} sent you a friend request!`,
        data: { 
          friendRequestId: friendRequest.id,
          requesterId: requesterId,
          requesterName: requester?.firstName || requester?.username
        },
      });

      // Send real-time notification via Pusher
      await pusher.trigger(`user-${addresseeId}`, 'friend-request', {
        title: '👋 Friend Request',
        message: `${requester?.firstName || requester?.username || 'Someone'} sent you a friend request!`,
        friendRequestId: friendRequest.id,
        requesterId: requesterId,
        requesterName: requester?.firstName || requester?.username,
        timestamp: new Date().toISOString(),
      });

      res.json(friendRequest);
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  app.patch('/api/friends/:id/accept', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const friendRequestId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const friend = await storage.acceptFriendRequest(friendRequestId);

      // Get user info
      const user = await storage.getUser(userId);
      const requester = await storage.getUser(friend.requesterId);

      // Create notification for requester
      await storage.createNotification({
        userId: friend.requesterId,
        type: 'friend_accepted',
        title: '✅ Friend Request Accepted',
        message: `${user?.firstName || user?.username || 'Someone'} accepted your friend request!`,
        data: { 
          friendId: userId,
          friendName: user?.firstName || user?.username
        },
      });

      // Send real-time notification via Pusher
      await pusher.trigger(`user-${friend.requesterId}`, 'friend-accepted', {
        title: '✅ Friend Request Accepted',
        message: `${user?.firstName || user?.username || 'Someone'} accepted your friend request!`,
        friendId: userId,
        friendName: user?.firstName || user?.username,
        timestamp: new Date().toISOString(),
      });

      res.json(friend);
    } catch (error) {
      console.error("Error accepting friend request:", error);
      res.status(500).json({ message: "Failed to accept friend request" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.markNotificationRead(notificationId);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Transaction routes
  app.get('/api/transactions', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get('/api/wallet/balance', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const balance = await storage.getUserBalance(userId);
      res.json(balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  // Wallet deposit route
  app.post('/api/wallet/deposit', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });      }

      if (!process.env.PAYSTACK_SECRET_KEY) {
        console.error("PAYSTACK_SECRET_KEY environment variable not set");
        return res.status(500).json({ message: "Payment service not configured" });
      }

      console.log("Initializing Paystack transaction for user:", userId, "amount:", amount);

      // Initialize Paystack transaction
      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: req.user.claims.email,
          amount: amount * 100, // Paystack expects amount in kobo
          currency: 'NGN',
          reference: `dep_${userId}_${Date.now()}`,
          callback_url: `${process.env.FRONTEND_URL || 'https://'+req.get('host')}/wallet`,
          metadata: {
            userId,
            type: 'deposit'
          }
        })
      });

      const paystackData = await paystackResponse.json();
      console.log("Paystack response:", paystackData);

      if (!paystackData.status) {
        console.error("Paystack error:", paystackData);
        return res.status(400).json({ message: paystackData.message || "Failed to initialize payment" });
      }

      console.log("Sending authorization URL:", paystackData.data.authorization_url);
      res.json({ 
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: paystackData.data.reference,
        publicKey: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_' // You'll need to set this in secrets
      });
    } catch (error) {
      console.error("Error processing deposit:", error);
      res.status(500).json({ message: "Failed to process deposit" });
    }
  });

  // Paystack webhook for payment verification
  app.post('/api/webhook/paystack', async (req, res) => {
    try {
      const hash = req.headers['x-paystack-signature'];
      const body = req.body;

      console.log('Webhook received:', {
        headers: req.headers,
        bodyType: typeof body,
        bodyLength: body?.length
      });

      // Handle both string and buffer bodies
      const bodyString = Buffer.isBuffer(body) ? body.toString() : (typeof body === 'string' ? body : JSON.stringify(body));

      // Verify signature if secret key is available
      if (process.env.PAYSTACK_SECRET_KEY) {
        const expectedHash = require('crypto')
          .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
          .update(bodyString)
          .digest('hex');

        console.log('Signature verification:', {
          receivedHash: hash,
          expectedHash,
          match: hash === expectedHash
        });

        if (hash !== expectedHash) {
          console.log('Invalid webhook signature');
          return res.status(400).json({ message: "Invalid signature" });
        }
      } else {
        console.log('Warning: PAYSTACK_SECRET_KEY not set, skipping signature verification');
      }

      // Parse the event
      let event;
      try {
        event = JSON.parse(bodyString);
      } catch (parseError) {
        console.error('Failed to parse webhook body:', parseError);
        return res.status(400).json({ message: "Invalid JSON" });
      }

      console.log('Webhook event:', event);

      if (event.event === 'charge.success') {
        const { reference, amount, metadata, status } = event.data;

        console.log('Processing charge.success:', {
          reference,
          amount,
          metadata,
          status
        });

        if (status === 'success' && metadata && metadata.userId) {
          const userId = metadata.userId;
          const depositAmount = amount / 100; // Convert from kobo to naira

          console.log(`Processing successful deposit for user ${userId}: ₦${depositAmount}`);

          try {
            // Create transaction record
            await storage.createTransaction({
              userId,
              type: 'deposit',
              amount: depositAmount.toString(),
              description: `Deposit via Paystack - ${reference}`,
              status: 'completed',
            });

            // Create notification for successful deposit
            await storage.createNotification({
              userId,
              type: 'deposit',
              title: '💰 Deposit Successful',
              message: `Your deposit of ₦${depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been credited to your account!`,
              data: { 
                amount: depositAmount,
                reference: reference,
                type: 'deposit',
                timestamp: new Date().toISOString()
              },
            });

            console.log(`✅ Deposit completed for user ${userId}: ₦${depositAmount}`);
          } catch (dbError) {
            console.error('Database error while creating transaction:', dbError);
            return res.status(500).json({ message: "Database error" });
          }
        } else {
          console.log('⚠️ Charge success but invalid status or missing metadata:', {
            status,
            hasMetadata: !!metadata,
            userId: metadata?.userId
          });
        }
      } else {
        console.log('Webhook event not charge.success:', event.event);
      }

      res.status(200).json({ message: "Webhook processed successfully" });
    } catch (error) {
      console.error("❌ Error processing webhook:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // Manual payment verification (for testing)
  app.post('/api/wallet/verify-payment', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const { reference } = req.body;
      const userId = req.user.claims.sub;

      if (!reference) {
        return res.status(400).json({ message: "Reference is required" });
      }

      console.log(`Manual verification requested for reference: ${reference}`);

      // Verify payment with Paystack
      const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        }
      });

      const verifyData = await verifyResponse.json();
      console.log('Paystack verification response:', verifyData);

      if (verifyData.status && verifyData.data.status === 'success') {
        const { amount, metadata } = verifyData.data;

        if (metadata && metadata.userId === userId) {
          const depositAmount = amount / 100; // Convert from kobo to naira

          // Check if transaction already exists
          const existingTransactions = await storage.getTransactions(userId);
          const exists = existingTransactions.some((t: any) => t.description?.includes(reference));

          if (!exists) {
            await storage.createTransaction({
              userId,
              type: 'deposit',
              amount: depositAmount.toString(),
              description: `Deposit via Paystack - ${reference}`,              status: 'completed',
            });

            // Create notification for successful deposit
            await storage.createNotification({
              userId,
              type: 'deposit',
              title: '💰 Deposit Successful',
              message: `Your deposit of ₦${depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been credited to your account!`,
              data: { 
                amount: depositAmount,
                reference: reference,
                type: 'deposit',
                timestamp: new Date().toISOString()
              },
            });

            console.log(`✅ Manual verification completed for user ${userId}: ₦${depositAmount}`);
            res.json({ message: "Payment verified successfully", amount: depositAmount });
          } else {
            console.log('Transaction already exists, skipping creation');
            res.json({ message: "Payment already processed", amount: depositAmount });
          }
        } else {
          console.log('Metadata userId mismatch or missing');
          res.status(400).json({ message: "Invalid payment verification" });
        }
      } else {
        console.log('Payment verification failed:', verifyData);
        res.status(400).json({ message: "Payment verification failed" });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  // Wallet withdrawal route
  app.post('/api/wallet/withdraw', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount, method } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const balance = await storage.getUserBalance(userId);
      if (balance.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Create withdrawal transaction
      await storage.createTransaction({
        userId,
        type: 'withdrawal',
        amount: `-${amount}`,
        description: `Withdrawal via ${method}`,
        status: 'pending',
      });

      // Create notification
      await storage.createNotification({
        userId,
        type: 'withdrawal',
        title: '📤 Withdrawal Requested',
        message: `Your withdrawal of ₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} is being processed.`,
        data: { amount, method },
      });

      res.json({ message: "Withdrawal request submitted successfully" });
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      res.status(500).json({ message: "Failed to process withdrawal" });
    }
  });

  // Global chat routes
  app.get('/api/chat/messages', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const messages = await storage.getGlobalChatMessages(50);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching global chat messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/chat/messages', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message } = req.body;

      if (!message?.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Get user info
      const user = await storage.getUser(userId);
      
      // Create message in BetChat
      const newMessage = await storage.createGlobalChatMessage({
        userId,
        user: {
          id: user?.id,
          firstName: user?.firstName,
          lastName: user?.lastName,
          username: user?.username,
          profileImageUrl: user?.profileImageUrl,
        },
        message: message.trim(),
        source: 'betchat'
      });

      // Broadcast to BetChat users via Pusher
      await pusher.trigger('global-chat', 'new-message', {
        type: 'chat_message',
        message: newMessage,
        source: 'betchat'
      });

      // Forward to Telegram if sync is available
      const telegramSync = getTelegramSync();
      if (telegramSync && telegramSync.isReady()) {
        const senderName = user?.firstName || user?.username || 'BetChat User';
        await telegramSync.sendMessageToTelegram(message.trim(), senderName);
      }

      res.json(newMessage);
    } catch (error) {
      console.error("Error creating global chat message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Telegram sync status route
  app.get('/api/telegram/status', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const telegramSync = getTelegramSync();
      
      if (!telegramSync) {
        return res.json({ 
          enabled: false, 
          connected: false, 
          message: "Telegram sync not configured" 
        });
      }

      const isReady = telegramSync.isReady();
      const groupInfo = isReady ? await telegramSync.getGroupInfo() : null;

      res.json({
        enabled: true,
        connected: isReady,
        groupInfo,
        message: isReady ? "Connected and syncing" : "Connecting..."
      });
    } catch (error) {
      console.error("Error getting Telegram status:", error);
      res.status(500).json({ message: "Failed to get Telegram status" });
    }
  });

  // Follow/Unfollow user route
  app.post('/api/users/:userId/follow', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.userId;

      if (followerId === followingId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }

      const result = await storage.toggleFollow(followerId, followingId);

      if (result.action === 'followed') {
        // Get follower info
        const follower = await storage.getUser(followerId);

        // Create notification for followed user
        await storage.createNotification({
          userId: followingId,
          type: 'new_follower',
          title: '👤 New Follower',
          message: `@${follower?.firstName || follower?.username || 'Someone'} is now following you!`,
          data: { 
            followerId: followerId,
            followerName: follower?.firstName || follower?.username
          },
        });

        // Send real-time notification via Pusher
        await pusher.trigger(`user-${followingId}`, 'new-follower', {
          title: '👤 New Follower',
          message: `@${follower?.firstName || follower?.username || 'Someone'} is now following you!`,
          followerId: followerId,
          followerName: follower?.firstName || follower?.username,
          timestamp: new Date().toISOString(),
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Error toggling follow:", error);
      res.status(500).json({ message: "Failed to toggle follow" });
    }
  });

  // Get user profile route
  app.get('/api/users/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Tip user route
  app.post('/api/users/:userId/tip', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const senderId = req.user.claims.sub;
      const receiverId = req.params.userId;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      if (senderId === receiverId) {
        return res.status(400).json({ message: "Cannot tip yourself" });
      }

      const balanceResult = await storage.getUserBalance(senderId);
      if (balanceResult.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Get sender and receiver info
      const sender = await storage.getUser(senderId);
      const receiver = await storage.getUser(receiverId);

      // Create transactions
      await storage.createTransaction({
        userId: senderId,
        type: 'tip_sent',
        amount: `-${amount}`,
        description: `Tip sent to @${receiver?.firstName || receiver?.username || 'user'}`,
        relatedId: receiverId,
      });

      await storage.createTransaction({
        userId: receiverId,
        type: 'tip_received',
        amount: amount.toString(),
        description: `Tip received from @${sender?.firstName || sender?.username || 'user'}`,
        relatedId: senderId,
      });

      // Create notification for receiver
      await storage.createNotification({
        userId: receiverId,
        type: 'tip_received',
        title: '💰 Tip Received',
        message: `You received a tip of ₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from @${sender?.firstName || sender?.username || 'Someone'}!`,
        data: { 
          amount: amount,
          senderId: senderId,
          senderName: sender?.firstName || sender?.username
        },
      });

      // Create notification for sender (confirmation)
      await storage.createNotification({
        userId: senderId,
        type: 'tip_sent',
        title: '💸 Tip Sent',
        message: `You tipped @${receiver?.firstName || receiver?.username || 'User'} ₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}!`,
        data: { 
          amount: amount,
          receiverId: receiverId,
          receiverName: receiver?.firstName || receiver?.username
        },
      });

      // Send real-time notifications via Pusher
      await pusher.trigger(`user-${receiverId}`, 'tip-received', {
        title: '💰 Tip Received',
        message: `You received a tip of ₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from @${sender?.firstName || sender?.username || 'Someone'}!`,
        amount: amount,
        senderId: senderId,
        senderName: sender?.firstName || sender?.username,
        timestamp: new Date().toISOString(),
      });

      await pusher.trigger(`user-${senderId}`, 'tip-sent', {
        title: '💸 Tip Sent',
        message: `You tipped @${receiver?.firstName || receiver?.username || 'User'} ₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}!`,
        amount: amount,
        receiverId: receiverId,
        receiverName: receiver?.firstName || receiver?.username,
        timestamp: new Date().toISOString(),
      });

      res.json({ message: "Tip sent successfully" });
    } catch (error) {
      console.error("Error sending tip:", error);
      res.status(500).json({ message: "Failed to send tip" });
    }
  });

  // Daily Sign-In Routes
  app.get('/api/daily-signin/status', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if user has already signed in today
      const todayLogin = await db
        .select()
        .from(dailyLogins)
        .where(and(
          eq(dailyLogins.userId, userId),
          sql`DATE(${dailyLogins.date}) = ${today.toISOString().split('T')[0]}`
        ))
        .limit(1);

      const hasSignedInToday = todayLogin.length > 0;
      const hasClaimed = hasSignedInToday ? todayLogin[0].claimed : false;

      // Get current streak
      const latestLogin = await db
        .select()
        .from(dailyLogins)
        .where(eq(dailyLogins.userId, userId))
        .orderBy(sql`${dailyLogins.date} DESC`)
        .limit(1);

      let currentStreak = 1;
      if (latestLogin.length > 0) {
        currentStreak = latestLogin[0].streak;
        
        // If they haven't signed in today, reset streak if yesterday wasn't their last login
        if (!hasSignedInToday) {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          const lastLoginDate = new Date(latestLogin[0].date);
          lastLoginDate.setHours(0, 0, 0, 0);
          
          if (lastLoginDate.getTime() !== yesterday.getTime()) {
            currentStreak = 1; // Reset streak
          } else {
            currentStreak = latestLogin[0].streak + 1; // Continue streak
          }
        }
      }

      // Calculate points to award (base 50 + streak bonus)
      const basePoints = 50;
      const streakBonus = Math.min(currentStreak * 10, 200); // Max 200 bonus
      const pointsToAward = basePoints + streakBonus;

      res.json({
        hasSignedInToday,
        hasClaimed,
        currentStreak,
        pointsToAward,
        showModal: hasSignedInToday && !hasClaimed
      });
    } catch (error) {
      console.error("Error checking daily sign-in status:", error);
      res.status(500).json({ message: "Failed to check daily sign-in status" });
    }
  });

  app.post('/api/daily-signin/claim', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if already claimed today
      const todayLogin = await db
        .select()
        .from(dailyLogins)
        .where(and(
          eq(dailyLogins.userId, userId),
          sql`DATE(${dailyLogins.date}) = ${today.toISOString().split('T')[0]}`
        ))
        .limit(1);

      if (todayLogin.length === 0) {
        return res.status(400).json({ message: "No sign-in record found for today" });
      }

      if (todayLogin[0].claimed) {
        return res.status(400).json({ message: "Daily bonus already claimed" });
      }

      const pointsEarned = todayLogin[0].pointsEarned;

      // Mark as claimed and award points
      await db
        .update(dailyLogins)
        .set({ claimed: true })
        .where(eq(dailyLogins.id, todayLogin[0].id));

      // Add points to user balance
      await db
        .update(users)
        .set({ 
          points: sql`${users.points} + ${pointsEarned}`,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      // Create transaction record
      await storage.createTransaction({
        userId,
        type: 'daily_signin',
        amount: pointsEarned.toString(),
        description: `Daily sign-in bonus - Day ${todayLogin[0].streak}`,
        status: 'completed'
      });

      res.json({ 
        message: "Daily bonus claimed successfully",
        pointsEarned,
        streak: todayLogin[0].streak
      });
    } catch (error) {
      console.error("Error claiming daily sign-in:", error);
      res.status(500).json({ message: "Failed to claim daily sign-in bonus" });
    }
  });

  // Get all users route (for user search and listing)
  app.get('/api/users', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // User stats and history routes
  app.get('/api/user/stats', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.get('/api/user/created-events', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const events = await storage.getUserCreatedEvents(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching user created events:", error);
      res.status(500).json({ message: "Failed to fetch user created events" });
    }
  });

  app.get('/api/user/joined-events', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const events = await storage.getUserJoinedEvents(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching user joined events:", error);
      res.status(500).json({ message: "Failed to fetch user joined events" });
    }
  });



  app.get('/api/user/achievements', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ message: "Failed to fetch user achievements" });
    }
  });

  app.get('/api/users/:userId/profile', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.params.userId;
      const currentUserId = req.user.claims.sub;
      const profile = await storage.getUserProfile(userId, currentUserId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Event lifecycle management routes
  app.post('/api/admin/events/:id/notify-starting', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const eventId = parseInt(req.params.id);
      await storage.notifyEventStarting(eventId);
      res.json({ message: "Event starting notifications sent" });
    } catch (error) {
      console.error("Error sending event starting notifications:", error);
      res.status(500).json({ message: "Failed to send notifications" });
    }
  });

  app.post('/api/admin/events/:id/notify-ending', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const eventId = parseInt(req.params.id);
      await storage.notifyEventEnding(eventId);
      res.json({ message: "Event ending notifications sent" });
    } catch (error) {
      console.error("Error sending event ending notifications:", error);
      res.status(500).json({ message: "Failed to send notifications" });
    }
  });

  // Admin statistics routes
  app.get('/api/admin/stats', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get('/api/admin/users', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const users = await storage.getRecentUsers(limit);
      res.json(users);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/admin/users/:userId/action', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      const { action, value, reason } = req.body;

      let result;
      switch (action) {
        case 'ban':
          result = await storage.banUser(userId, reason);
          break;
        case 'unban':
          result = await storage.unbanUser(userId, reason);
          break;
        case 'balance':
          result = await storage.adjustUserBalance(userId, parseFloat(value), reason);
          break;
        case 'admin':
          result = await storage.setUserAdminStatus(userId, value === 'true', reason);
          break;
        case 'message':
          result = await storage.sendAdminMessage(userId, value, reason);
          break;
        default:
          return res.status(400).json({ message: "Invalid action type" });
      }

      res.json(result);
    } catch (error) {
      console.error("Error executing user action:", error);
      res.status(500).json({ message: "Failed to execute user action" });
    }
  });

  app.get('/api/admin/activity', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const activity = await storage.getPlatformActivity(limit);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching platform activity:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  // Admin challenge routes
  app.get('/api/admin/challenges', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const challenges = await storage.getAllChallenges(limit);
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching admin challenges:", error);
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });

  app.post('/api/admin/challenges/:id/result', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const challengeId = parseInt(req.params.id);
      const { result } = req.body; // 'challenger_won', 'challenged_won', 'draw'

      if (!['challenger_won', 'challenged_won', 'draw'].includes(result)) {
        return res.status(400).json({ message: "Invalid result. Must be 'challenger_won', 'challenged_won', or 'draw'" });
      }

      // Log admin action for audit trail
      console.log(`Admin ${userId} setting result for challenge ${challengeId}: ${result}`);

      // Validate challenge exists and is ready for payout
      const existingChallenge = await storage.getChallengeById(challengeId);
      if (!existingChallenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }

      if (existingChallenge.status === 'completed') {
        return res.status(400).json({ message: "Challenge already completed" });
      }

      const challenge = await storage.adminSetChallengeResult(challengeId, result);
      const payoutResult = await storage.processChallengePayouts(challengeId);

      // Log payout for audit trail
      console.log(`Challenge ${challengeId} payout processed:`, {
        winnerPayout: payoutResult.winnerPayout,
        platformFee: payoutResult.platformFee,
        winnerId: payoutResult.winnerId,
        processedBy: userId,
        timestamp: new Date().toISOString()
      });

      // Send real-time notification to participants
      await pusher.trigger(`challenge-${challengeId}`, 'challenge-resolved', {
        challengeId,
        result,
        winnerPayout: payoutResult.winnerPayout,
        platformFee: payoutResult.platformFee,
        timestamp: new Date().toISOString()
      });

      res.json({ 
        challenge, 
        payout: payoutResult,
        message: `Challenge result set to ${result}. Payout processed: ₦${payoutResult.winnerPayout.toLocaleString()} distributed, ₦${payoutResult.platformFee.toLocaleString()} platform fee.`
      });
    } catch (error) {
      console.error("Error setting challenge result:", error);
      res.status(500).json({ message: error.message || "Failed to set challenge result" });
    }
  });

  app.get('/api/admin/challenges/:id/escrow', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      const escrowStatus = await storage.getChallengeEscrowStatus(challengeId);
      res.json(escrowStatus);
    } catch (error) {
      console.error("Error fetching challenge escrow status:", error);
      res.status(500).json({ message: "Failed to fetch escrow status" });
    }
  });

  // Admin notifications routes
  app.get('/api/admin/notifications', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const notifications = await storage.getAdminNotifications(limit);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching admin notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post('/api/admin/notifications/broadcast', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const { title, message, type, targetUserIds } = req.body;

      const result = await storage.broadcastNotification({
        title,
        message,
        type: type || 'admin_announcement',
        targetUserIds: targetUserIds || null, // null means all users
      });

      res.json(result);
    } catch (error) {
      console.error("Error broadcasting notification:", error);
      res.status(500).json({ message: "Failed to broadcast notification" });
    }
  });

  // Admin user search routes
  app.get('/api/admin/users/search', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const { query, limit = 50 } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }

      const users = await storage.searchUsers(query, parseInt(limit as string));
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // Leaderboard route
  app.get('/api/leaderboard', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
