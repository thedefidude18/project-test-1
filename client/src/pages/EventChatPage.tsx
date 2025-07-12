
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
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const { sendMessage, isConnected } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'event_message' && data.eventId === eventId) {
        refetchMessages();
      }
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      await apiRequest("POST", `/api/events/${eventId}/messages`, { message });
    },
    onSuccess: () => {
      setNewMessage("");
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
        description: `You've bet ₦${betAmount} on ${prediction ? 'YES' : 'NO'}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
      setIsBettingDialogOpen(false);
      setBetAmount("");
      setPrediction(null);
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

  const handleSendMessage = () => {
    if (!newMessage.trim() || !isConnected) return;
    sendMessageMutation.mutate(newMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handlePlaceBet = () => {
    if (prediction !== null && betAmount && parseFloat(betAmount) > 0) {
      joinEventMutation.mutate();
    }
  };

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
            <div className="text-right">
              <div className="text-lg font-bold">₦ {totalPool.toLocaleString()}</div>
              <div className="text-xs text-white/80">Total Pool</div>
            </div>
          </div>

          {/* Betting Banner */}
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-800 px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 py-8">
            <i className="fas fa-comments text-2xl mb-2"></i>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message: any, index: number) => {
            const showAvatar = index === 0 || messages[index - 1]?.userId !== message.userId;
            const isCurrentUser = message.userId === user?.id;
            
            return (
              <div key={message.id} className={`flex space-x-3 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {showAvatar && !isCurrentUser && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage 
                      src={message.user.profileImageUrl || undefined} 
                      alt={message.user.firstName || message.user.username || 'User'} 
                    />
                    <AvatarFallback className="text-xs bg-primary text-white">
                      {(message.user.firstName?.[0] || message.user.username?.[0] || 'U').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`flex-1 max-w-xs ${isCurrentUser ? 'text-right' : ''} ${!showAvatar && !isCurrentUser ? 'ml-11' : ''}`}>
                  {showAvatar && (
                    <div className={`flex items-center space-x-2 mb-1 ${isCurrentUser ? 'justify-end' : ''}`}>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {message.user.firstName || message.user.username || 'Anonymous'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                  
                  <div className={`inline-block px-3 py-2 rounded-2xl ${
                    isCurrentUser 
                      ? 'bg-primary text-white' 
                      : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                  }`}>
                    <p className="text-sm break-words">{message.message}</p>
                  </div>
                  
                  {/* Emoji reactions placeholder */}
                  <div className="flex items-center space-x-1 mt-1">
                    <button className="text-xs bg-slate-200 dark:bg-slate-600 rounded-full px-2 py-1 flex items-center space-x-1 hover:bg-slate-300 dark:hover:bg-slate-500">
                      <span>😊</span>
                      <span>12</span>
                    </button>
                    <button className="text-xs bg-slate-200 dark:bg-slate-600 rounded-full px-2 py-1 flex items-center space-x-1 hover:bg-slate-300 dark:hover:bg-slate-500">
                      <span>🔥</span>
                      <span>12</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:bg-primary/10 p-2"
          >
            <i className="fas fa-smile text-lg"></i>
          </Button>
          
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Start a message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="bg-slate-100 dark:bg-slate-700 border-none rounded-full pl-4 pr-12 py-3"
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
            className="bg-primary text-white hover:bg-primary/90 rounded-full p-3"
          >
            <i className="fas fa-paper-plane"></i>
          </Button>
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
    </div>
  );
}
