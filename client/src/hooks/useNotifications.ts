import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useState, useEffect } from "react";

export function useNotifications() {
  const [realtimeNotifications, setRealtimeNotifications] = useState<any[]>([]);

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  const { sendMessage, isConnected } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'new_notification') {
        // Add new notification to realtime list
        setRealtimeNotifications(prev => [data.notification, ...prev]);
        // Refetch all notifications to sync with server
        refetch();
      }
    }
  });

  // Combine server notifications with realtime ones
  const allNotifications = [...realtimeNotifications, ...notifications].reduce((acc, notification) => {
    // Remove duplicates based on ID
    if (!acc.find(n => n.id === notification.id)) {
      acc.push(notification);
    }
    return acc;
  }, []);

  const unreadCount = allNotifications.filter((n: any) => !n.read).length;

  // Clear realtime notifications that are older than 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeNotifications(prev => 
        prev.filter(n => {
          const notificationTime = new Date(n.createdAt).getTime();
          const now = Date.now();
          return (now - notificationTime) < 5 * 60 * 1000; // 5 minutes
        })
      );
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return {
    notifications: allNotifications,
    unreadCount,
    isConnected,
    refetch,
  };
}
