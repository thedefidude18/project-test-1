import axios from 'axios';

interface TelegramBotConfig {
  token: string;
  channelId: string;
}

interface EventBroadcast {
  id: string | number;
  title: string;
  description?: string;
  creator: {
    name: string;
    username?: string;
  };
  pool?: {
    total_amount?: number;
    entry_amount?: number;
  };
  eventPool?: string;
  yesPool?: string;
  noPool?: string;
  entryFee?: string;
  end_time?: string;
  endDate?: string;
  is_private?: boolean;
  max_participants?: number;
  category?: string;
}

interface ChallengeBroadcast {
  id: string | number;
  title: string;
  description?: string;
  creator: {
    name: string;
    username?: string;
  };
  challenged?: {
    name: string;
    username?: string;
  };
  stake_amount: number;
  status: string;
  end_time?: string;
  category?: string;
}

export class TelegramBotService {
  private token: string;
  private channelId: string;
  private baseUrl: string;

  constructor(config: TelegramBotConfig) {
    this.token = config.token;
    this.channelId = config.channelId;
    this.baseUrl = `https://api.telegram.org/bot${this.token}`;
  }

  // Test bot connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/getMe`);
      console.log('🤖 Telegram bot connected:', response.data.result.username);
      return true;
    } catch (error) {
      console.error('❌ Telegram bot connection failed:', error);
      return false;
    }
  }

  // Format event message for Telegram
  private formatEventMessage(event: EventBroadcast): string {
    const webAppUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || 'betchat.replit.app';
    const eventUrl = `https://${webAppUrl}/events/${event.id}/chat`;
    
    // Calculate pool total
    const eventPoolValue = parseFloat(event.eventPool || '0');
    const yesPoolValue = parseFloat(event.yesPool || '0');
    const noPoolValue = parseFloat(event.noPool || '0');
    const poolTotal = event.pool?.total_amount || 
      (eventPoolValue > 0 ? eventPoolValue : yesPoolValue + noPoolValue) || 0;
    
    // Format entry fee
    const entryFee = event.pool?.entry_amount || parseFloat(event.entryFee || '0');
    
    // Format time
    const endTime = event.end_time || event.endDate;
    let timeInfo = '';
    if (endTime) {
      try {
        const endDate = new Date(endTime);
        if (!isNaN(endDate.getTime())) {
          timeInfo = `⏰ Ends: ${endDate.toLocaleString()}`;
        }
      } catch (error) {
        console.warn('Invalid date in event:', endTime);
      }
    }

    const message = `🎯 **NEW EVENT CREATED**

📝 **${event.title}**
${event.description ? `\n💭 ${event.description}` : ''}

👤 **Creator:** ${event.creator.name}${event.creator.username ? ` (@${event.creator.username})` : ''}
💰 **Pool:** ₦${poolTotal.toLocaleString()}
🎫 **Entry Fee:** ₦${entryFee.toLocaleString()}
${event.max_participants ? `👥 **Max Participants:** ${event.max_participants}` : ''}
${event.category ? `🏷️ **Category:** ${event.category}` : ''}
${event.is_private ? '🔒 **Private Event**' : '🌍 **Public Event**'}
${timeInfo}

🚀 **Join the event:** [Click here](${eventUrl})

#BetChat #Event #Prediction`;

    return message;
  }

  // Format challenge message for Telegram
  private formatChallengeMessage(challenge: ChallengeBroadcast): string {
    const webAppUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || 'betchat.replit.app';
    const challengeUrl = `https://${webAppUrl}/challenges/${challenge.id}`;
    
    // Format time
    const endTime = challenge.end_time;
    let timeInfo = '';
    if (endTime) {
      try {
        const endDate = new Date(endTime);
        if (!isNaN(endDate.getTime())) {
          timeInfo = `⏰ Ends: ${endDate.toLocaleString()}`;
        }
      } catch (error) {
        console.warn('Invalid date in challenge:', endTime);
      }
    }

    const message = `⚔️ **NEW CHALLENGE CREATED**

📝 **${challenge.title}**
${challenge.description ? `\n💭 ${challenge.description}` : ''}

👤 **Challenger:** ${challenge.creator.name}${challenge.creator.username ? ` (@${challenge.creator.username})` : ''}
${challenge.challenged ? `🎯 **Challenged:** ${challenge.challenged.name}${challenge.challenged.username ? ` (@${challenge.challenged.username})` : ''}` : '🌍 **Open Challenge**'}
💰 **Stake:** ₦${challenge.stake_amount.toLocaleString()}
${challenge.category ? `🏷️ **Category:** ${challenge.category}` : ''}
📊 **Status:** ${challenge.status}
${timeInfo}

🚀 **View challenge:** [Click here](${challengeUrl})

#BetChat #Challenge #P2P`;

    return message;
  }

  // Send message to Telegram channel
  private async sendToChannel(message: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: this.channelId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      });

      if (response.data.ok) {
        console.log('📤 Message sent to Telegram channel successfully');
        return true;
      } else {
        console.error('❌ Failed to send to Telegram:', response.data);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending to Telegram channel:', error);
      return false;
    }
  }

  // Broadcast new event
  async broadcastEvent(event: EventBroadcast): Promise<boolean> {
    try {
      const message = this.formatEventMessage(event);
      return await this.sendToChannel(message);
    } catch (error) {
      console.error('❌ Error broadcasting event:', error);
      return false;
    }
  }

  // Broadcast new challenge
  async broadcastChallenge(challenge: ChallengeBroadcast): Promise<boolean> {
    try {
      const message = this.formatChallengeMessage(challenge);
      return await this.sendToChannel(message);
    } catch (error) {
      console.error('❌ Error broadcasting challenge:', error);
      return false;
    }
  }

  // Send custom message to channel
  async sendCustomMessage(message: string): Promise<boolean> {
    try {
      return await this.sendToChannel(message);
    } catch (error) {
      console.error('❌ Error sending custom message:', error);
      return false;
    }
  }

  // Get channel info
  async getChannelInfo(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/getChat`, {
        params: { chat_id: this.channelId }
      });
      
      if (response.data.ok) {
        return response.data.result;
      } else {
        console.error('❌ Failed to get channel info:', response.data);
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting channel info:', error);
      return null;
    }
  }
}

// Singleton instance
let telegramBot: TelegramBotService | null = null;

export function createTelegramBot(): TelegramBotService | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;

  if (!token || !channelId) {
    console.log('⚠️ Telegram bot credentials not found. Broadcasting disabled.');
    console.log('💡 Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_ID to enable broadcasting');
    return null;
  }

  if (telegramBot) {
    return telegramBot;
  }

  try {
    telegramBot = new TelegramBotService({ token, channelId });
    console.log('🤖 Telegram bot service initialized');
    return telegramBot;
  } catch (error) {
    console.error('❌ Failed to create Telegram bot service:', error);
    return null;
  }
}

export function getTelegramBot(): TelegramBotService | null {
  return telegramBot;
}