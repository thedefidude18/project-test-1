import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { getUserChannel } from '@/lib/pusher';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export interface NotificationData {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize notification sound
    notificationSound.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmclBTyaT4+6VhcETX3SLN0pKZVfpJBLlZWBTFlZbpMYgV1zjZV1TlBBTZKGjVpVJrJhz5xZfJSJjV5QM5PnWEZEa2vqJSktMVdCRZ3xRGX');

    if (user?.id) {
      // Subscribe to user-specific notifications
      const channel = getUserChannel(user.id);
      channelRef.current = channel;

      // Handle challenge notifications
      channel.bind('challenge-notification', (data: NotificationData) => {
        // Play notification sound
        if (notificationSound.current) {
          notificationSound.current.play().catch(e => console.log('Audio play failed:', e));
        }

        // Show toast notification
        toast({
          title: data.title,
          description: data.message,
          duration: 5000,
        });

        // Invalidate notification queries to refresh the notification list
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        
        // If it's a challenge notification, also invalidate challenges
        if (data.type === 'challenge' || data.type === 'challenge_sent') {
          queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
        }
      });

      // Handle event notifications
      channel.bind('event-notification', (data: NotificationData) => {
        if (notificationSound.current) {
          notificationSound.current.play().catch(e => console.log('Audio play failed:', e));
        }

        toast({
          title: data.title,
          description: data.message,
          duration: 4000,
        });

        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      });

      // Handle friend notifications
      channel.bind('friend-notification', (data: NotificationData) => {
        if (notificationSound.current) {
          notificationSound.current.play().catch(e => console.log('Audio play failed:', e));
        }

        toast({
          title: data.title,
          description: data.message,
          duration: 4000,
        });

        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      });

      // Handle wallet notifications
      channel.bind('wallet-notification', (data: NotificationData) => {
        if (notificationSound.current) {
          notificationSound.current.play().catch(e => console.log('Audio play failed:', e));
        }

        toast({
          title: data.title,
          description: data.message,
          duration: 4000,
        });

        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      });

      // Handle achievement notifications
      channel.bind('achievement-notification', (data: NotificationData) => {
        if (notificationSound.current) {
          notificationSound.current.play().catch(e => console.log('Audio play failed:', e));
        }

        toast({
          title: data.title,
          description: data.message,
          duration: 6000,
        });

        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user/achievements"] });
      });
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        channelRef.current = null;
      }
    };
  }, [user?.id, toast, queryClient]);

  return {
    // Utility function to manually trigger notifications for testing
    triggerTestNotification: (type: string, title: string, message: string) => {
      if (notificationSound.current) {
        notificationSound.current.play().catch(e => console.log('Audio play failed:', e));
      }
      
      toast({
        title,
        description: message,
        duration: 4000,
      });
    }
  };
}