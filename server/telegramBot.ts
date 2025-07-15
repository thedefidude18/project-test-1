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

interface ChallengeResultBroadcast {
  id: string | number;
  title: string;
  winner: {
    name: string;
    username?: string;
  };
  loser: {
    name: string;
    username?: string;
  };
  stake_amount: number;
  category?: string;
  result_type: 'challenger_wins' | 'challenged_wins' | 'draw';
}

interface MatchmakingBroadcast {
  challengeId: string | number;
  challenger: {
    name: string;
    username?: string;
  };
  challenged: {
    name: string;
    username?: string;
  };
  stake_amount: number;
  category?: string;
}

interface LeaderboardBroadcast {
  user: {
    name: string;
    username?: string;
  };
  new_rank: number;
  old_rank?: number;
  total_wins: number;
  total_earnings: number;
  achievement?: string;
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
  async testConnection(): Promise<{ connected: boolean; botInfo?: any; channelInfo?: any; error?: string }> {
    try {
      // Test bot connection
      const botResponse = await axios.get(`${this.baseUrl}/getMe`);
      const botInfo = botResponse.data.result;
      console.log('🤖 Telegram bot connected:', botInfo.username);
      
      // Test channel connection
      try {
        const channelResponse = await axios.get(`${this.baseUrl}/getChat`, {
          params: { chat_id: this.channelId }
        });
        
        if (channelResponse.data.ok) {
          const channelInfo = channelResponse.data.result;
          console.log('📢 Channel found:', channelInfo.title || channelInfo.first_name);
          return { 
            connected: true, 
            botInfo, 
            channelInfo 
          };
        } else {
          console.error('❌ Channel not accessible:', channelResponse.data);
          return { 
            connected: false, 
            botInfo, 
            error: `Channel error: ${channelResponse.data.description}` 
          };
        }
      } catch (channelError) {
        console.error('❌ Channel connection failed:', channelError);
        return { 
          connected: false, 
          botInfo, 
          error: `Channel connection failed: ${axios.isAxiosError(channelError) ? channelError.response?.data?.description : 'Unknown error'}` 
        };
      }
    } catch (error) {
      console.error('❌ Telegram bot connection failed:', error);
      return { 
        connected: false, 
        error: `Bot connection failed: ${axios.isAxiosError(error) ? error.response?.data?.description : 'Unknown error'}` 
      };
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
          const now = new Date();
          const diffMs = endDate.getTime() - now.getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffDays = Math.floor(diffHours / 24);
          
          if (diffDays > 0) {
            timeInfo = `⏰ *${diffDays}d ${diffHours % 24}h remaining*`;
          } else if (diffHours > 0) {
            timeInfo = `⏰ *${diffHours}h remaining*`;
          } else {
            timeInfo = `⏰ *Ending soon!*`;
          }
        }
      } catch (error) {
        console.warn('Invalid date in event:', endTime);
      }
    }

    // Get category emoji
    const getCategoryEmoji = (category: string) => {
      const categoryMap: { [key: string]: string } = {
        'crypto': '₿',
        'sports': '⚽',
        'gaming': '🎮',
        'music': '🎵',
        'politics': '🏛️',
        'entertainment': '🎬',
        'tech': '💻',
        'science': '🔬'
      };
      return categoryMap[category?.toLowerCase()] || '🎯';
    };

    const categoryEmoji = getCategoryEmoji(event.category || '');
    const privacyEmoji = event.is_private ? '🔒' : '🌍';
    const creatorDisplay = event.creator.username ? `@${event.creator.username}` : event.creator.name;

    const message = `🔥 *NEW PREDICTION EVENT*

━━━━━━━━━━━━━━━━━━━━━
${categoryEmoji} *${event.title}*
━━━━━━━━━━━━━━━━━━━━━

${event.description ? `💭 _${event.description}_\n` : ''}
👤 *Creator:* ${creatorDisplay}
💰 *Current Pool:* ₦${poolTotal.toLocaleString()}
🎫 *Entry Fee:* ₦${entryFee.toLocaleString()}
👥 *Max Players:* ${event.max_participants || 'Unlimited'}
${privacyEmoji} *${event.is_private ? 'Private' : 'Public'}* • ${categoryEmoji} *${(event.category || 'General').charAt(0).toUpperCase() + (event.category || 'General').slice(1)}*

${timeInfo}

━━━━━━━━━━━━━━━━━━━━━
🚀 [*JOIN EVENT NOW*](${eventUrl})
━━━━━━━━━━━━━━━━━━━━━

#BetChat #Prediction #${event.category || 'Event'}`;

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
          const now = new Date();
          const diffMs = endDate.getTime() - now.getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffDays = Math.floor(diffHours / 24);
          
          if (diffDays > 0) {
            timeInfo = `⏰ *${diffDays}d ${diffHours % 24}h to accept*`;
          } else if (diffHours > 0) {
            timeInfo = `⏰ *${diffHours}h to accept*`;
          } else {
            timeInfo = `⏰ *Accept soon!*`;
          }
        }
      } catch (error) {
        console.warn('Invalid date in challenge:', endTime);
      }
    }

    // Get category emoji  
    const getCategoryEmoji = (category: string) => {
      const categoryMap: { [key: string]: string } = {
        'crypto': '₿',
        'sports': '⚽',
        'gaming': '🎮',
        'music': '🎵',
        'politics': '🏛️',
        'entertainment': '🎬',
        'tech': '💻',
        'science': '🔬'
      };
      return categoryMap[category?.toLowerCase()] || '⚔️';
    };

    const categoryEmoji = getCategoryEmoji(challenge.category || '');
    const challengerDisplay = challenge.creator.username ? `@${challenge.creator.username}` : challenge.creator.name;
    const challengedDisplay = challenge.challenged 
      ? (challenge.challenged.username ? `@${challenge.challenged.username}` : challenge.challenged.name)
      : null;

    const statusEmoji = challenge.status === 'pending' ? '⏳' : 
                       challenge.status === 'active' ? '🔥' : 
                       challenge.status === 'completed' ? '✅' : '📋';

    const message = `⚔️ *NEW P2P CHALLENGE*

━━━━━━━━━━━━━━━━━━━━━
${categoryEmoji} *${challenge.title}*
━━━━━━━━━━━━━━━━━━━━━

${challenge.description ? `💭 _${challenge.description}_\n` : ''}
🚀 *Challenger:* ${challengerDisplay}
${challengedDisplay ? `🎯 *Challenged:* ${challengedDisplay}` : '🌍 *Open Challenge - Anyone can accept!*'}
💰 *Stake Amount:* ₦${challenge.stake_amount.toLocaleString()}
${statusEmoji} *Status:* ${challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
${challenge.category ? `${categoryEmoji} *Category:* ${challenge.category.charAt(0).toUpperCase() + challenge.category.slice(1)}` : ''}

${timeInfo}

━━━━━━━━━━━━━━━━━━━━━
🎯 [*VIEW CHALLENGE*](${challengeUrl})
━━━━━━━━━━━━━━━━━━━━━

#BetChat #Challenge #P2P #${challenge.category || 'Battle'}`;

    return message;
  }

  // Format challenge result message for Telegram
  private formatChallengeResultMessage(result: ChallengeResultBroadcast): string {
    const getCategoryEmoji = (category: string) => {
      const categoryMap: { [key: string]: string } = {
        'crypto': '₿', 'sports': '⚽', 'gaming': '🎮', 'music': '🎵',
        'politics': '🏛️', 'entertainment': '🎬', 'tech': '💻', 'science': '🔬'
      };
      return categoryMap[category?.toLowerCase()] || '⚔️';
    };

    const categoryEmoji = getCategoryEmoji(result.category || '');
    const winnerDisplay = result.winner.username ? `@${result.winner.username}` : result.winner.name;
    const loserDisplay = result.loser.username ? `@${result.loser.username}` : result.loser.name;
    
    const resultEmoji = result.result_type === 'draw' ? '🤝' : '🏆';
    const resultText = result.result_type === 'draw' ? 'DRAW' : 'VICTORY';

    const message = `${resultEmoji} *CHALLENGE ${resultText}*

━━━━━━━━━━━━━━━━━━━━━
${categoryEmoji} *${result.title}*
━━━━━━━━━━━━━━━━━━━━━

${result.result_type === 'draw' ? 
  `🤝 *Both players fought well!*
💰 *Stakes returned:* ₦${result.stake_amount.toLocaleString()} each
👥 *${winnerDisplay}* vs *${loserDisplay}*` :
  `🏆 *Winner:* ${winnerDisplay}
💸 *Loser:* ${loserDisplay}
💰 *Prize:* ₦${(result.stake_amount * 2).toLocaleString()}`}

${result.category ? `${categoryEmoji} *Category:* ${result.category.charAt(0).toUpperCase() + result.category.slice(1)}` : ''}

━━━━━━━━━━━━━━━━━━━━━

#BetChat #Challenge #${result.result_type === 'draw' ? 'Draw' : 'Victory'} #${result.category || 'Battle'}`;

    return message;
  }

  // Format matchmaking message for Telegram
  private formatMatchmakingMessage(match: MatchmakingBroadcast): string {
    const getCategoryEmoji = (category: string) => {
      const categoryMap: { [key: string]: string } = {
        'crypto': '₿', 'sports': '⚽', 'gaming': '🎮', 'music': '🎵',
        'politics': '🏛️', 'entertainment': '🎬', 'tech': '💻', 'science': '🔬'
      };
      return categoryMap[category?.toLowerCase()] || '⚔️';
    };

    const categoryEmoji = getCategoryEmoji(match.category || '');
    const challengerDisplay = match.challenger.username ? `@${match.challenger.username}` : match.challenger.name;
    const challengedDisplay = match.challenged.username ? `@${match.challenged.username}` : match.challenged.name;

    const message = `🔥 *CHALLENGE ACCEPTED*

━━━━━━━━━━━━━━━━━━━━━
⚔️ *BATTLE BEGINS*
━━━━━━━━━━━━━━━━━━━━━

🚀 *Challenger:* ${challengerDisplay}
🎯 *Accepted by:* ${challengedDisplay}
💰 *Stakes:* ₦${match.stake_amount.toLocaleString()} each
${match.category ? `${categoryEmoji} *Category:* ${match.category.charAt(0).toUpperCase() + match.category.slice(1)}` : ''}

🍿 *The battle is ON! May the best player win!*

━━━━━━━━━━━━━━━━━━━━━

#BetChat #MatchMade #Battle #${match.category || 'Challenge'}`;

    return message;
  }

  // Format leaderboard update message for Telegram
  private formatLeaderboardMessage(update: LeaderboardBroadcast): string {
    const userDisplay = update.user.username ? `@${update.user.username}` : update.user.name;
    
    const rankEmoji = update.new_rank <= 3 ? 
      (update.new_rank === 1 ? '🥇' : update.new_rank === 2 ? '🥈' : '🥉') : '🏅';
    
    const changeEmoji = update.old_rank ? 
      (update.new_rank < update.old_rank ? '📈' : update.new_rank > update.old_rank ? '📉' : '➡️') : '⭐';
    
    const changeText = update.old_rank ? 
      (update.new_rank < update.old_rank ? 
        `climbed from #${update.old_rank} to #${update.new_rank}` :
        update.new_rank > update.old_rank ? 
        `dropped from #${update.old_rank} to #${update.new_rank}` :
        `maintained #${update.new_rank}`) :
      `entered the leaderboard at #${update.new_rank}`;

    const message = `${rankEmoji} *LEADERBOARD UPDATE*

━━━━━━━━━━━━━━━━━━━━━
${changeEmoji} *RANK CHANGE*
━━━━━━━━━━━━━━━━━━━━━

👤 *Player:* ${userDisplay}
${rankEmoji} *New Rank:* #${update.new_rank}
${changeEmoji} *${userDisplay}* ${changeText}

📊 *Stats:*
🏆 *Total Wins:* ${update.total_wins}
💰 *Total Earnings:* ₦${update.total_earnings.toLocaleString()}
${update.achievement ? `🎯 *Achievement:* ${update.achievement}` : ''}

━━━━━━━━━━━━━━━━━━━━━
🏆 *Climb the ranks and dominate!*
━━━━━━━━━━━━━━━━━━━━━

#BetChat #Leaderboard #Ranking #Champion`;

    return message;
  }

  // Send message to Telegram channel
  private async sendToChannel(message: string): Promise<boolean> {
    try {
      console.log(`🔍 Attempting to send message to channel: ${this.channelId}`);
      
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
        console.error('❌ Failed to send to Telegram:');
        console.error('Channel ID:', this.channelId);
        console.error('Error:', response.data);
        
        if (response.data.error_code === 400 && response.data.description?.includes('chat not found')) {
          console.error('🚨 TELEGRAM SETUP ISSUE:');
          console.error('   1. Check if TELEGRAM_CHANNEL_ID is correct');
          console.error('   2. Ensure bot is added to the channel as admin');
          console.error('   3. Channel ID should start with -100 for channels or @ for usernames');
        }
        
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending to Telegram channel:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      }
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

  // Broadcast challenge result (win/loss)
  async broadcastChallengeResult(result: ChallengeResultBroadcast): Promise<boolean> {
    try {
      const message = this.formatChallengeResultMessage(result);
      return await this.sendToChannel(message);
    } catch (error) {
      console.error('❌ Error broadcasting challenge result:', error);
      return false;
    }
  }

  // Broadcast matchmaking (challenge accepted)
  async broadcastMatchmaking(match: MatchmakingBroadcast): Promise<boolean> {
    try {
      const message = this.formatMatchmakingMessage(match);
      return await this.sendToChannel(message);
    } catch (error) {
      console.error('❌ Error broadcasting matchmaking:', error);
      return false;
    }
  }

  // Broadcast leaderboard update
  async broadcastLeaderboardUpdate(update: LeaderboardBroadcast): Promise<boolean> {
    try {
      const message = this.formatLeaderboardMessage(update);
      return await this.sendToChannel(message);
    } catch (error) {
      console.error('❌ Error broadcasting leaderboard update:', error);
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