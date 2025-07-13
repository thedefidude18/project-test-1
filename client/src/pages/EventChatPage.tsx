import { useParams } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getEventChannel, getUserChannel } from "@/lib/pusher";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
  userReacted: boolean;
}

interface ExtendedMessage {
  id: string;
  eventId: number;
  userId: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    profileImageUrl?: string;
  };
  reactions?: MessageReaction[];
  replyTo?: {
    id: string;
    message: string;
    user: {
      firstName?: string;
      username?: string;
    };
  };
  mentions?: string[];
}

const COMMON_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export default function EventChatPage() {
  const params = useParams();
  const eventId = params.id ? parseInt(params.id) : null;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [prediction, setPrediction] = useState<boolean | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [isBettingDialogOpen, setIsBettingDialogOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<ExtendedMessage | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [hasUserBet, setHasUserBet] = useState(false);
  const [userBetLocked, setUserBetLocked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [isBannerHidden, setIsBannerHidden] = useState(false);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);

  const { data: event } = useQuery({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["/api/events", eventId, "messages"],
    enabled: !!eventId,
    retry: false,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ["/api/events", eventId, "participants"],
    enabled: !!eventId,
    retry: false,
  });

  // Check if user has already bet
  useEffect(() => {
    if (participants.length > 0 && user) {
      const userParticipant = participants.find((p: any) => p.userId === user.id);
      if (userParticipant) {
        setHasUserBet(true);
        setUserBetLocked(true);
      }
    }
  }, [participants, user]);

  // Pusher real-time messaging setup
  useEffect(() => {
    if (!eventId) return;

    const channel = getEventChannel(eventId);

    channel.bind('new-message', (data: any) => {
      refetchMessages();
    });

    channel.bind('reaction-update', (data: any) => {
      refetchMessages();
    });

    return () => {
      channel.unbind('new-message');
      channel.unbind('reaction-update');
    };
  }, [eventId, refetchMessages]);

  const { sendMessage, isConnected } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'event_message' && data.eventId === eventId) {
        refetchMessages();
      } else if (data.type === 'user_typing' && data.eventId === eventId) {
        if (data.userId !== user?.id) {
          setTypingUsers(prev => {
            const filtered = prev.filter(id => id !== data.userId);
            return data.isTyping ? [...filtered, data.userId] : filtered;
          });
        }
      } else if (data.type === 'message_reaction' && data.eventId === eventId) {
        refetchMessages();
      }
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { message: string; replyToId?: string; mentions?: string[] }) => {
      await apiRequest("POST", `/api/events/${eventId}/messages`, messageData);
    },
    onSuccess: () => {
      setNewMessage("");
      setReplyingTo(null);
      refetchMessages();
      sendMessage({
        type: 'event_message',
        eventId,
        message: newMessage,
        userId: user?.id,
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reactToMessageMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      await apiRequest("POST", `/api/events/${eventId}/messages/${messageId}/react`, { emoji });
    },
    onSuccess: () => {
      refetchMessages();
      sendMessage({
        type: 'message_reaction',
        eventId,
        userId: user?.id,
      });
    },
  });

  const joinEventMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/events/${eventId}/join`, {
        prediction,
        amount: parseFloat(betAmount),
      });
    },
    onSuccess: () => {
      toast({
        title: "Bet Placed!",
        description: `You've bet ₦${betAmount} on ${prediction ? 'YES' : 'NO'}. Your funds are now locked until the event concludes.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      setIsBettingDialogOpen(false);
      setBetAmount("");
      setPrediction(null);
      setHasUserBet(true);
      setUserBetLocked(true);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing indicators
  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    sendMessage({
      type: 'user_typing',
      eventId,
      userId: user?.id,
      isTyping: true,
    });

    typingTimeoutRef.current = setTimeout(() => {
      sendMessage({
        type: 'user_typing',
        eventId,
        userId: user?.id,
        isTyping: false,
      });
    }, 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Handle @ mentions
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentions(true);
      setMentionQuery("");
    } else if (lastAtIndex !== -1) {
      const query = value.slice(lastAtIndex + 1);
      if (query.includes(' ')) {
        setShowMentions(false);
      } else {
        setMentionQuery(query);
        setShowMentions(true);
      }
    } else {
      setShowMentions(false);
    }

    handleTyping();
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !isConnected) return;

    // Extract mentions
    const mentions = extractMentions(newMessage);

    sendMessageMutation.mutate({
      message: newMessage,
      replyToId: replyingTo?.id,
      mentions,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === 'Escape') {
      setReplyingTo(null);
      setShowMentions(false);
    }
  };

  const handlePlaceBet = () => {
    if (hasUserBet || userBetLocked) {
      toast({
        title: "Already Bet",
        description: "You have already placed a bet on this event. Your funds are locked until the event concludes.",
        variant: "destructive",
      });
      return;
    }

    if (prediction !== null && betAmount && parseFloat(betAmount) > 0) {
      joinEventMutation.mutate();
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    reactToMessageMutation.mutate({ messageId, emoji });
  };

  const handleReply = (message: ExtendedMessage) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const handleMention = (username: string) => {
    const lastAtIndex = newMessage.lastIndexOf('@');
    const beforeAt = newMessage.slice(0, lastAtIndex);
    const afterQuery = newMessage.slice(lastAtIndex + 1 + mentionQuery.length);
    setNewMessage(`${beforeAt}@${username} ${afterQuery}`);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  const filteredParticipants = participants.filter((p: any) =>
    p.user.username?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    p.user.firstName?.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  if (!eventId || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Event Not Found
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            The event you're looking for doesn't exist.
          </p>
          <Button onClick={() => window.location.href = '/events'}>
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading event...</p>
        </div>
      </div>
    );
  }

  const totalPool = parseFloat(event.yesPool) + parseFloat(event.noPool);
  const yesPercentage = totalPool > 0 ? (parseFloat(event.yesPool) / totalPool) * 100 : 50;
  const noPercentage = 100 - yesPercentage;

  const toggleBannerVisibility = () => {
    setIsBannerHidden(!isBannerHidden);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Header with Event Info and Back Button */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = '/events'}
                  className="text-white hover:bg-white/20 p-2"
                >
                  <i className="fas fa-arrow-left"></i>
                </Button>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <i className="fas fa-users text-white text-sm"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">@{event.title}</h3>
                    <p className="text-xs text-white/80">{messages.length} Members</p>
                  </div>
                </div>
              </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                  <span className="sr-only">Open menu</span>
                  <i className="fas fa-ellipsis-v text-white"></i>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem>
                  <i className="fas fa-search mr-2"></i>
                  Search
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleBannerVisibility}>
                  {isBannerHidden ? (
                    <>
                      <i className="fas fa-eye mr-2"></i>
                      Show Banner
                    </>
                  ) : (
                    <>
                      <i className="fas fa-eye-slash mr-2"></i>
                      Hide Banner
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <i className="fas fa-flag mr-2"></i>
                  Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigator.share({ url: window.location.href })}>
                  <i className="fas fa-share mr-2"></i>
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Leave Event
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Betting Banner */}
          {!isBannerHidden && (
          <div className="bg-black/30 rounded-xl p-3 mb-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1 truncate">{event.description || event.title}</h4>
                <div className="flex items-center space-x-4 text-xs">
                  <span className="flex items-center">
                    <i className="fas fa-clock mr-1"></i>
                    {formatDistanceToNow(new Date(event.endDate), { addSuffix: true })}
                  </span>
                  <span>Event Pool ₦ {totalPool.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex space-x-2 ml-3">
                {hasUserBet || userBetLocked ? (
                  <div className="flex items-center space-x-2">
                    <div className="bg-yellow-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      <i className="fas fa-lock mr-1"></i>
                      Bet Locked
                    </div>
                    <div className="text-xs text-white/80">
                      Funds locked until event ends
                    </div>
                  </div>
                ) : (
                  <Dialog open={isBettingDialogOpen} onOpenChange={setIsBettingDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-full font-medium"
                        onClick={() => setPrediction(true)}
                      >
                        YES
                        <div className="text-xs ml-1">{yesPercentage.toFixed(0)}%</div>
                      </Button>
                    </DialogTrigger>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full font-medium"
                        onClick={() => setPrediction(false)}
                      >
                        NO
                        <div className="text-xs ml-1">{noPercentage.toFixed(0)}%</div>
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-800 px-3 py-3 space-y-2 flex flex-col-reverse">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 py-8">
            <i className="fas fa-comments text-2xl mb-2"></i>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          [...messages].reverse().map((message: ExtendedMessage, index: number) => {
            const showAvatar = index === 0 || messages[messages.length - 2 - index]?.userId !== message.userId;
            const isCurrentUser = message.userId === user?.id;
            const isConsecutive = index > 0 && messages[messages.length - 2 - index]?.userId === message.userId;

            return (
              <div key={message.id} className={`flex space-x-2 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''} ${isConsecutive ? 'mt-1' : 'mt-3'}`}>
                {showAvatar && !isCurrentUser && (
                  <Avatar 
                    className="w-6 h-6 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                    onClick={() => setSelectedProfileUserId(message.user.id)}
                  >
                    <AvatarImage 
                      src={message.user.profileImageUrl || undefined} 
                      alt={message.user.firstName || message.user.username || 'User'} 
                    />
                    <AvatarFallback className="text-xs">
                      {(message.user.firstName?.[0] || message.user.username?.[0] || 'U').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={`flex-1 max-w-[75%] ${isCurrentUser ? 'text-right' : ''} ${!showAvatar && !isCurrentUser ? 'ml-8' : ''}`}>
                  {showAvatar && (
                    <div className={`flex items-center space-x-2 mb-1 ${isCurrentUser ? 'justify-end' : ''}`}>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {message.user.firstName || message.user.username || 'Anonymous'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  )}

                  {/* Reply indicator */}
                  {message.replyTo && (
                    <div className={`text-xs text-slate-500 dark:text-slate-400 mb-1 ${isCurrentUser ? 'text-right' : ''}`}>
                      <i className="fas fa-reply mr-1"></i>
                      Replying to {message.replyTo.user.firstName || message.replyTo.user.username}
                    </div>
                  )}

                  <div className="group relative">
                    <div className={`inline-block px-3 py-2 rounded-2xl text-sm max-w-full break-words ${
                      isCurrentUser 
                        ? 'bg-primary text-white' 
                        : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                    }`}>
                      {message.replyTo && (
                        <div className={`text-xs opacity-75 mb-1 p-2 rounded border-l-2 ${
                          isCurrentUser ? 'border-white/30 bg-white/10' : 'border-slate-300 bg-slate-50 dark:bg-slate-600'
                        }`}>
                          "{message.replyTo.message.length > 50 ? message.replyTo.message.substring(0, 50) + '...' : message.replyTo.message}"
                        </div>
                      )}
                      <p className="break-words">{message.message}</p>
                    </div>

                    {/* Message actions */}
                    <div className={`absolute top-0 ${isCurrentUser ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 bg-white dark:bg-slate-800 shadow-lg rounded-lg px-2 py-1`}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <i className="fas fa-smile text-xs"></i>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                          <div className="flex space-x-1">
                            {COMMON_REACTIONS.map((emoji) => (
                              <Button
                                key={emoji}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-lg hover:bg-slate-100"
                                onClick={() => handleReaction(message.id, emoji)}
                              >
                                {emoji}
                              </Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>

                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0"
                        onClick={() => handleReply(message)}
                      >
                        <i className="fas fa-reply text-xs"></i>
                      </Button>
                    </div>
                  </div>

                  {/* Reactions */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${isCurrentUser ? 'justify-end' : ''}`}>
                      {message.reactions.map((reaction, idx) => (
                        <button
                          key={idx}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-md active:scale-95 ${
                            reaction.userReacted 
                              ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm' 
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'
                          }`}
                          onClick={() => handleReaction(message.id, reaction.emoji)}
                        >
                          <span className="text-xs leading-none">{reaction.emoji}</span>
                          <span className="text-xs leading-none font-semibold">{reaction.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="flex space-x-2">
            <div className="w-6 h-6 bg-slate-200 dark:bg-slate-600 rounded-full flex-shrink-0"></div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                  {typingUsers.length === 1 ? 'Someone is' : `${typingUsers.length} people are`} typing...
                </span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="bg-slate-200 dark:bg-slate-700 px-4 py-2 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Replying to {replyingTo.user.firstName || replyingTo.user.username}
              </span>
              <p className="text-sm text-slate-800 dark:text-slate-200 truncate">
                {replyingTo.message}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
              <i className="fas fa-times text-xs"></i>
            </Button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-3 sticky bottom-0">
        <div className="relative">
          {/* Mentions dropdown */}
          {showMentions && filteredParticipants.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-t-lg shadow-lg max-h-40 overflow-y-auto z-10">
              {filteredParticipants.slice(0, 5).map((participant: any) => (
                <div
                  key={participant.user.id}
                  className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center space-x-2"
                  onClick={() => handleMention(participant.user.username || participant.user.firstName)}
                >
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={participant.user.profileImageUrl} />
                    <AvatarFallback className="text-xs">
                      {(participant.user.firstName?.[0] || participant.user.username?.[0] || 'U').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{participant.user.firstName || participant.user.username}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary/10 p-2"
            >
              <i className="fas fa-smile text-lg"></i>
            </Button>

            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                className="bg-slate-100 dark:bg-slate-700 border-none rounded-full pl-4 pr-12 py-2"
                disabled={!isConnected}
              />
              {!isConnected && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
              )}
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isConnected || sendMessageMutation.isPending}
              className="bg-primary text-white hover:bg-primary/90 rounded-full p-2"
            >
              <i className="fas fa-paper-plane"></i>
            </Button>
          </div>
        </div>
      </div>

      {/* Betting Dialog */}
      <Dialog open={isBettingDialogOpen} onOpenChange={setIsBettingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Place Your Bet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Your Prediction</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant={prediction === true ? "default" : "outline"}
                  onClick={() => setPrediction(true)}
                  className={prediction === true ? "bg-emerald-600 text-white" : ""}
                >
                  YES ({yesPercentage.toFixed(1)}%)
                </Button>
                <Button
                  variant={prediction === false ? "default" : "outline"}
                  onClick={() => setPrediction(false)}
                  className={prediction === false ? "bg-red-600 text-white" : ""}
                >
                  NO ({noPercentage.toFixed(1)}%)
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Bet Amount (₦)</label>
              <Input
                type="number"
                placeholder="Enter amount..."
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="mt-1"
                min="1"
              />
              <p className="text-xs text-slate-500 mt-1">
                Minimum bet: ₦{event.entryFee}
              </p>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsBettingDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePlaceBet}
                disabled={prediction === null || !betAmount || joinEventMutation.isPending}
                className="flex-1 bg-primary text-white hover:bg-primary/90"
              >
                {joinEventMutation.isPending ? "Placing..." : "Place Bet"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Card Modal */}
      {selectedProfileUserId && (
        <ProfileCard 
          userId={selectedProfileUserId} 
          onClose={() => setSelectedProfileUserId(null)} 
        />
      )}
    </div>
  );
}