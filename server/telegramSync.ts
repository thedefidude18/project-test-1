
import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import { NewMessage } from "telegram/events";
import Pusher from "pusher";
import { storage } from "./storage";

interface TelegramConfig {
  apiId: number;
  apiHash: string;
  stringSession: string;
  groupId?: string;
  botMode?: boolean;
}

export class TelegramSyncService {
  private client: TelegramClient;
  private pusher: Pusher;
  private groupId: string | null = null;
  private isConnected = false;

  constructor(config: TelegramConfig, pusher: Pusher) {
    this.pusher = pusher;
    
    const stringSession = new StringSession(config.stringSession);
    this.client = new TelegramClient(stringSession, config.apiId, config.apiHash, {
      connectionRetries: 5,
    });

    if (config.groupId) {
      this.groupId = config.groupId;
    }
  }

  async initialize(): Promise<void> {
    try {
      console.log("🔄 Initializing Telegram client...");
      
      await this.client.start({
        phoneNumber: async () => {
          throw new Error("Phone number should be pre-authenticated via session string");
        },
        password: async () => {
          throw new Error("Password should be pre-authenticated via session string");
        },
        phoneCode: async () => {
          throw new Error("Phone code should be pre-authenticated via session string");
        },
        onError: (err) => console.error("Telegram auth error:", err),
      });

      console.log("✅ Telegram client connected successfully");
      console.log("📱 Session string:", this.client.session.save());
      
      this.isConnected = true;
      
      // Find the target group if groupId not set
      if (!this.groupId) {
        await this.findTargetGroup();
      }

      // Set up message listeners
      this.setupMessageListeners();
      
    } catch (error) {
      console.error("❌ Failed to initialize Telegram client:", error);
      
      // Handle specific errors gracefully
      if (error.message && error.message.includes('AUTH_KEY_DUPLICATED')) {
        console.log("⚠️ Telegram session is being used by another instance. Telegram sync disabled.");
        console.log("💡 To fix this, generate a new session string or stop other instances using the same session.");
      } else if (error.message && error.message.includes('AUTH_KEY_INVALID')) {
        console.log("⚠️ Telegram session is invalid. Please re-authenticate.");
        console.log("💡 Generate a new session string using the authentication script.");
      }
      
      // Don't throw the error - let the service continue without Telegram sync
      this.isConnected = false;
    }
  }

  private async findTargetGroup(): Promise<void> {
    try {
      const dialogs = await this.client.getDialogs({});
      
      console.log("📋 Available chats:");
      for (const dialog of dialogs) {
        if (dialog.isGroup || dialog.isChannel) {
          console.log(`  - ${dialog.title} (ID: ${dialog.id})`);
        }
      }
      
      // You can set a specific group name to auto-find
      const targetGroupName = process.env.TELEGRAM_GROUP_NAME || "BetChat Official";
      const targetGroup = dialogs.find(d => 
        (d.isGroup || d.isChannel) && 
        d.title?.toLowerCase().includes(targetGroupName.toLowerCase())
      );
      
      if (targetGroup) {
        this.groupId = targetGroup.id.toString();
        console.log(`🎯 Found target group: ${targetGroup.title} (${this.groupId})`);
      } else {
        console.log("⚠️ Target group not found. Please set TELEGRAM_GROUP_ID manually.");
      }
    } catch (error) {
      console.error("Error finding target group:", error);
    }
  }

  private setupMessageListeners(): void {
    if (!this.groupId) {
      console.log("⚠️ No group ID set, skipping message listeners");
      return;
    }

    console.log(`👂 Setting up message listeners for group: ${this.groupId}`);
    
    // Listen for new messages in the target group
    this.client.addEventHandler(async (update) => {
      try {
        await this.handleTelegramMessage(update);
      } catch (error) {
        console.error("Error handling Telegram message:", error);
      }
    }, new NewMessage({ chats: [parseInt(this.groupId)] }));

    console.log("✅ Telegram message listeners active");
  }

  private async handleTelegramMessage(update: any): Promise<void> {
    const message = update.message;
    if (!message || !message.message) return;

    const senderId = message.senderId?.toString();
    const senderName = await this.getSenderName(message);
    const messageText = message.message;
    const timestamp = new Date(message.date * 1000).toISOString();

    console.log(`📨 Telegram → BetChat: ${senderName}: ${messageText}`);

    // Create a "virtual" user for Telegram users in BetChat
    const virtualUserId = `telegram_${senderId}`;
    
    // Store message in BetChat database
    const chatMessage = await storage.createGlobalChatMessage({
      id: `tg_${message.id}`,
      userId: virtualUserId,
      user: {
        id: virtualUserId,
        firstName: senderName,
        username: senderName,
        profileImageUrl: null,
        isTelegramUser: true,
      },
      message: messageText,
      createdAt: timestamp,
      source: 'telegram'
    });

    // Broadcast to all BetChat users via Pusher
    await this.pusher.trigger('global-chat', 'new-message', {
      type: 'chat_message',
      message: chatMessage,
      source: 'telegram'
    });

    console.log("✅ Telegram message synced to BetChat");
  }

  private async getSenderName(message: any): Promise<string> {
    try {
      if (message.fromId) {
        const user = await this.client.getEntity(message.fromId);
        if (user.firstName) {
          return user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
        }
        if (user.username) {
          return `@${user.username}`;
        }
      }
      return "Telegram User";
    } catch (error) {
      console.error("Error getting sender name:", error);
      return "Telegram User";
    }
  }

  async sendMessageToTelegram(message: string, senderName: string, eventInfo?: { id: number; title: string }): Promise<boolean> {
    if (!this.isConnected || !this.groupId) {
      console.log("⚠️ Cannot send to Telegram: not connected or no group ID");
      return false;
    }

    try {
      let formattedMessage: string;
      
      if (eventInfo) {
        // Format with event context for multi-room differentiation
        const timestamp = new Date().toLocaleTimeString();
        formattedMessage = `🎯 [${eventInfo.title}]\n👤 ${senderName}: ${message}\n⏰ ${timestamp}\n\n#event${eventInfo.id}`;
      } else {
        // Default global chat format
        formattedMessage = `🌐 [BetChat] ${senderName}: ${message}`;
      }
      
      await this.client.sendMessage(parseInt(this.groupId), {
        message: formattedMessage,
      });

      console.log(`📤 BetChat → Telegram: ${senderName}: ${message}${eventInfo ? ` [Event: ${eventInfo.title}]` : ''}`);
      return true;
    } catch (error) {
      console.error("Error sending message to Telegram:", error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
      console.log("🔌 Telegram client disconnected");
    }
  }

  // Utility methods
  async getGroupInfo(): Promise<any> {
    if (!this.groupId) return null;
    
    try {
      const entity = await this.client.getEntity(parseInt(this.groupId));
      return {
        id: entity.id,
        title: entity.title,
        participantsCount: entity.participantsCount,
        username: entity.username,
      };
    } catch (error) {
      console.error("Error getting group info:", error);
      return null;
    }
  }

  isReady(): boolean {
    return this.isConnected && !!this.groupId;
  }
}

// Singleton instance
let telegramSync: TelegramSyncService | null = null;

export function createTelegramSync(pusher: Pusher): TelegramSyncService | null {
  // Check if Telegram sync is explicitly disabled
  if (process.env.TELEGRAM_DISABLED === 'true') {
    console.log("📱 Telegram sync explicitly disabled via TELEGRAM_DISABLED environment variable");
    return null;
  }

  const apiId = process.env.TELEGRAM_API_ID;
  const apiHash = process.env.TELEGRAM_API_HASH;
  const stringSession = process.env.TELEGRAM_SESSION_STRING;
  const groupId = process.env.TELEGRAM_GROUP_ID;

  if (!apiId || !apiHash) {
    console.log("⚠️ Telegram API credentials not found. Telegram sync disabled.");
    console.log("💡 To enable Telegram sync, set TELEGRAM_API_ID and TELEGRAM_API_HASH environment variables");
    console.log("📖 See TELEGRAM_SETUP_GUIDE.md for detailed setup instructions");
    return null;
  }

  if (!stringSession || stringSession.trim() === '' || stringSession === 'your_session_string_here') {
    console.log("⚠️ Telegram session string not found or empty. Please authenticate first.");
    console.log("💡 Generate a session string using the script in TELEGRAM_SETUP_GUIDE.md");
    console.log("🔧 Or set TELEGRAM_DISABLED=true to disable Telegram sync");
    return null;
  }

  // Validate session string format (basic check)
  if (stringSession.length < 50) {
    console.log("⚠️ Telegram session string appears to be invalid (too short). Please re-authenticate.");
    console.log("📖 See TELEGRAM_SETUP_GUIDE.md for session string generation instructions");
    return null;
  }

  if (telegramSync) {
    return telegramSync;
  }

  try {
    telegramSync = new TelegramSyncService({
      apiId: parseInt(apiId),
      apiHash,
      stringSession,
      groupId,
    }, pusher);

    return telegramSync;
  } catch (error) {
    console.error("❌ Failed to create Telegram sync service:", error);
    console.log("⚠️ Telegram sync disabled due to configuration error. Please check your session string.");
    console.log("📖 See TELEGRAM_SETUP_GUIDE.md for troubleshooting steps");
    console.log("🔧 Or set TELEGRAM_DISABLED=true to disable Telegram sync");
    return null;
  }
}

export function getTelegramSync(): TelegramSyncService | null {
  return telegramSync;
}
