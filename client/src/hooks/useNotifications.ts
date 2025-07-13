import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/lib/notifications";
import { useToast } from "@/hooks/use-toast";

// Pusher client for real-time notifications
let pusher: any = null;

// Initialize Pusher client
const initializePusher = async () => {
  if (!pusher) {
    const PusherClient = (await import('pusher-js')).default;
    pusher = new PusherClient(import.meta.env.VITE_PUSHER_KEY || 'default-key', {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER || 'us2',
      encrypted: true,
    });
  }
  return pusher;
};

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Initialize notification service
    notificationService.requestPermission();
    notificationService.initializeServiceWorker();

    const setupPusherNotifications = async () => {
      try {
        const pusherClient = await initializePusher();
        
        // Subscribe to user-specific notifications
        const userChannel = pusherClient.subscribe(`user-${user.id}`);
        
        // Handle challenge notifications
        userChannel.bind('challenge-received', (data: any) => {
          // Show instant push notification
          notificationService.showChallengeNotification({
            challengerName: data.challengerName,
            challengeTitle: data.challengeTitle,
            amount: data.amount,
            challengeId: data.challengeId
          });

          // Update challenges cache
          queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });

          // Show in-app toast notification
          toast({
            title: "🎯 Challenge Received!",
            description: `${data.challengerName} challenged you to "${data.challengeTitle}" for ₦${data.amount.toLocaleString()}`,
            duration: 8000,
          });
        });

        // Handle challenge accepted notifications
        userChannel.bind('challenge-accepted', (data: any) => {
          notificationService.showNotification("🎯 Challenge Accepted!", {
            body: data.message,
            tag: `challenge-accepted-${data.challengeId}`,
            data: { type: 'challenge_accepted', challengeId: data.challengeId }
          });

          queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });

          toast({
            title: "🎯 Challenge Accepted!",
            description: data.message,
            duration: 6000,
          });
        });

        // Handle challenge active notifications
        userChannel.bind('challenge-active', (data: any) => {
          notificationService.showNotification("🔒 Challenge Active", {
            body: data.message,
            tag: `challenge-active-${data.challengeId}`,
            data: { type: 'challenge_active', challengeId: data.challengeId }
          });

          queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });

          toast({
            title: "🔒 Challenge Active",
            description: data.message,
            duration: 6000,
          });
        });

        // Handle friend request notifications
        userChannel.bind('friend-request', (data: any) => {
          notificationService.showFriendNotification({
            friendName: data.friendName,
            type: 'friend_request',
            friendId: data.friendId
          });

          queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });

          toast({
            title: "👋 Friend Request",
            description: `${data.friendName} sent you a friend request`,
            duration: 6000,
          });
        });

        // Handle message notifications
        userChannel.bind('new-message', (data: any) => {
          notificationService.showMessageNotification({
            senderName: data.senderName,
            message: data.message,
            chatType: data.chatType,
            chatId: data.chatId
          });

          // Don't show toast for messages as they're handled in chat components
        });

        // Handle event notifications
        userChannel.bind('event-starting', (data: any) => {
          notificationService.showEventNotification({
            title: "🚀 Event Starting",
            message: data.message,
            eventId: data.eventId,
            type: 'event_starting'
          });

          queryClient.invalidateQueries({ queryKey: ["/api/events"] });
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });

          toast({
            title: "🚀 Event Starting",
            description: data.message,
            duration: 6000,
          });
        });

        userChannel.bind('event-ending', (data: any) => {
          notificationService.showEventNotification({
            title: "⏰ Event Ending",
            message: data.message,
            eventId: data.eventId,
            type: 'event_ending'
          });

          queryClient.invalidateQueries({ queryKey: ["/api/events"] });
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });

          toast({
            title: "⏰ Event Ending",
            description: data.message,
            duration: 6000,
          });
        });

        userChannel.bind('funds-released', (data: any) => {
          notificationService.showNotification("💰 Funds Released", {
            body: data.message,
            tag: `funds-released-${data.eventId}`,
            data: { type: 'funds_released', eventId: data.eventId }
          });

          queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
          queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });

          toast({
            title: "💰 Funds Released",
            description: data.message,
            duration: 8000,
          });
        });

        console.log('Pusher notifications initialized for user:', user.id);
        
      } catch (error) {
        console.error('Failed to initialize Pusher notifications:', error);
      }
    };

    setupPusherNotifications();

    // Cleanup on unmount or user change
    return () => {
      if (pusher) {
        pusher.unsubscribe(`user-${user.id}`);
      }
    };
  }, [user, queryClient, toast]);

  // Handle window message events from service worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ACCEPT_CHALLENGE') {
        // Handle challenge acceptance from notification
        window.location.href = `/challenges?accept=${event.data.challengeId}`;
      } else if (event.data.type === 'DECLINE_CHALLENGE') {
        // Handle challenge decline from notification
        window.location.href = `/challenges?decline=${event.data.challengeId}`;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return {
    requestPermission: () => notificationService.requestPermission(),
    showNotification: (title: string, options: NotificationOptions) => 
      notificationService.showNotification(title, options),
  };
}