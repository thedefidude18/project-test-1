
import { authenticateTelegram } from '../server/telegramAuth.ts';

console.log('🔐 Telegram Authentication Script');
console.log('This will help you set up Telegram integration for BetChat');
console.log('');

authenticateTelegram().catch(console.error);
