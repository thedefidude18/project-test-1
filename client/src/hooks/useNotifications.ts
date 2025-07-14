import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useEffect } from 'react';
import { pusher } from '@/lib/pusher';
import { useToast } from './use-toast';

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: () => apiRequest('GET', '/api/notifications'),
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest('PATCH', `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Set up real-time notifications
  useEffect(() => {
    if (!user?.id) return;

    console.log('Pusher notifications initialized for user:', user.id);

    const channel = pusher.subscribe(`user-${user.id}`);

    // Listen for various notification types
    const notificationEvents = [
      'challenge-received',
      'challenge-sent',
      'challenge-accepted',
      'challenge-active',
      'friend-request',
      'friend-accepted',
      'new-follower',
      'tip-received',
      'tip-sent',
      'event-notification',
      'funds-locked',
      'participant-joined'
    ];

    notificationEvents.forEach(eventName => {
      channel.bind(eventName, (data: any) => {
        console.log(`Received ${eventName}:`, data);
        
        // Show instant toast notification for receiving events (not sent events)
        if (eventName === 'tip-received' || eventName === 'new-follower' || eventName === 'challenge-received' || eventName === 'friend-request') {
          // Play notification sound
          try {
            const audio = new Audio('/assets/message-notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(console.error);
          } catch (e) {
            console.error('Failed to play notification sound:', e);
          }

          toast({
            title: data.title || '🔔 New Notification',
            description: data.message || 'You have a new notification',
            duration: 5000,
          });
        }
        
        // Refresh notifications list
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      });
    });

    return () => {
      notificationEvents.forEach(eventName => {
        channel.unbind(eventName);
      });
      pusher.unsubscribe(`user-${user.id}`);
    };
  }, [user?.id, queryClient, toast]);

  return {
    notifications: notifications || [],
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    unreadCount: Array.isArray(notifications) ? notifications.filter((n: any) => !n.read).length : 0,
  };
}