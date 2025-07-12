import { useParams } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { MobileNavigation } from "@/components/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      // Also send via WebSocket for real-time updates
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/events'}
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Events
          </Button>
          
          <Dialog open={isBettingDialogOpen} onOpenChange={setIsBettingDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white hover:bg-primary/90">
                <i className="fas fa-dice mr-2"></i>
                Place Bet
              </Button>
            </DialogTrigger>
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
                      YES
                    </Button>
                    <Button
                      variant={prediction === false ? "default" : "outline"}
                      onClick={() => setPrediction(false)}
                      className={prediction === false ? "bg-red-600 text-white" : ""}
                    >
                      NO
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Info */}
          <div className="lg:col-span-1">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                    {event.status}
                  </Badge>
                  <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                    {event.category}
                  </span>
                </div>
                <CardTitle className="text-xl">{event.title}</CardTitle>
                {event.description && (
                  <p className="text-slate-600 dark:text-slate-400">{event.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Pool Distribution</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">YES</span>
                          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                            {yesPercentage.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          ₦{parseFloat(event.yesPool).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-red-700 dark:text-red-300">NO</span>
                          <span className="text-sm font-bold text-red-700 dark:text-red-300">
                            {noPercentage.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-red-600 dark:text-red-400 font-semibold">
                          ₦{parseFloat(event.noPool).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Entry Fee</p>
                    <p className="font-semibold">₦{parseFloat(event.entryFee).toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Ends</p>
                    <p className="font-semibold">
                      {formatDistanceToNow(new Date(event.endDate), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-[600px] flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Live Chat 💬</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {messages.length} messages
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                      <i className="fas fa-comments text-2xl mb-2"></i>
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message: any) => (
                      <div key={message.id} className="flex space-x-2">
                        <Avatar className="w-6 h-6 flex-shrink-0">
                          <AvatarImage 
                            src={message.user.profileImageUrl || undefined} 
                            alt={message.user.firstName || message.user.username || 'User'} 
                          />
                          <AvatarFallback className="text-xs">
                            {(message.user.firstName?.[0] || message.user.username?.[0] || 'U').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {message.user.firstName || message.user.username || 'Anonymous'}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300 break-words">
                            {message.message}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="flex-1 bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                      disabled={!isConnected}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || !isConnected || sendMessageMutation.isPending}
                      className="bg-primary text-white hover:bg-primary/90"
                    >
                      <i className="fas fa-paper-plane"></i>
                    </Button>
                  </div>
                  {!isConnected && (
                    <p className="text-xs text-red-500 mt-1">Disconnected - trying to reconnect...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}
