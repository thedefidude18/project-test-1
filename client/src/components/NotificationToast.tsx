import { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';

export function NotificationToast() {
  const { notifications, markAsRead } = useNotifications();
  const { toast } = useToast();

  useEffect(() => {
    if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
      return;
    }

    const unreadNotifications = notifications.filter((n: any) => !n.read);

    unreadNotifications.forEach((notification: any) => {
      toast({
        title: notification.title,
        description: notification.message,
        duration: 5000,
      });

      // Mark as read after showing toast
      markAsRead(notification.id);
    });
  }, [notifications, toast, markAsRead]);

  return null;
}