
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function Bantzz() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm Bantzz, your AI assistant for all things BetChat! I can help you with questions about events, challenges, wallet management, and more. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simulate AI response for now
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: generateAIResponse(inputMessage),
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('event') || input.includes('bet')) {
      return "Events in BetChat are community-driven prediction markets! You can create events, place bets, and chat with other users in real-time. To create an event, go to the Events page and click 'Create Event'. You can bet on outcomes and win coins based on your predictions!";
    } else if (input.includes('challenge')) {
      return "Challenges are peer-to-peer competitions where you can challenge friends or other users to various predictions! You can create challenges, accept them, and compete for coins. Check out the Challenges page to see active challenges or create your own!";
    } else if (input.includes('wallet') || input.includes('coin') || input.includes('money')) {
      return "Your wallet manages your coins and balance in BetChat! You can earn coins through successful predictions, daily sign-ins, and referrals. Click on your wallet balance in the header to view your transaction history and manage your funds.";
    } else if (input.includes('friend')) {
      return "The Friends system lets you connect with other users, compare performance, and challenge each other! You can add friends, view their stats, and see how you rank against them. Visit the Friends page to manage your connections!";
    } else if (input.includes('level') || input.includes('rank')) {
      return "BetChat has a leveling system based on your activity and success! You earn XP through betting, creating events, and social interactions. Check your profile to see your current level and progress toward the next one!";
    } else if (input.includes('notification')) {
      return "Notifications keep you updated on event outcomes, challenge responses, friend requests, and more! You can manage your notification preferences in Settings and view all notifications in the Notifications page.";
    } else if (input.includes('help') || input.includes('how')) {
      return "I'm here to help! You can ask me about:\n• Creating and betting on events\n• Managing challenges\n• Wallet and coins\n• Friend system\n• Notifications\n• Account settings\n• And much more about BetChat!";
    } else {
      return "That's a great question! I'm constantly learning about BetChat. For specific features, you can explore the different sections like Events, Challenges, Wallet, and Friends. If you need immediate help, try asking about a specific feature or check out the website tour in your profile menu!";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition">

        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400">Please log in to access Bantzz AI Assistant</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition">
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 relative">
              <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-spin opacity-30"></div>
              <div className="absolute inset-1 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-500" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Bantzz AI Assistant
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Your intelligent guide to BetChat
              </p>
            </div>
          </div>
        </div>

        <Card className="h-[600px] flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Chat with Bantzz
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 pr-4 mb-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.isUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!message.isUser && (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mt-1 flex-shrink-0">
                            <Bot className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {message.isUser && (
                          <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center mt-1 flex-shrink-0">
                            <User className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                          <Bot className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about BetChat..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
