
import { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';

export function NotificationToast() {
  const { notifications, markAsRead } = useNotifications();
  const { toast } = useToast();

  useEffect(() => {
    if (!notifications || !Array.isArray(notifications)) {
      return;
    }

    const unreadNotifications = notifications.filter(n => !n.read);
    
    unreadNotifications.forEach((notification) => {
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
