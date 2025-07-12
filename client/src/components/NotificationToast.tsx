import { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface NotificationData {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  createdAt: string;
}

export function NotificationToast() {
  const { notifications } = useNotifications();
  const [currentNotification, setCurrentNotification] = useState<NotificationData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const acceptChallengeMutation = useMutation({
    mutationFn: async (challengeId: number) => {
      await apiRequest("PATCH", `/api/challenges/${challengeId}`, {
        status: 'active'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      hideNotification();
    },
  });

  const acceptFriendRequestMutation = useMutation({
    mutationFn: async (friendRequestId: number) => {
      await apiRequest("PATCH", `/api/friends/${friendRequestId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      hideNotification();
    },
  });

  useEffect(() => {
    const unreadNotifications = notifications.filter((n: any) => !n.read);
    
    if (unreadNotifications.length > 0 && !currentNotification) {
      const latest = unreadNotifications[0];
      setCurrentNotification(latest);
      setIsVisible(true);
      
      // Auto-hide after 10 seconds for non-interactive notifications
      if (!['challenge', 'friend'].includes(latest.type)) {
        setTimeout(() => {
          hideNotification();
        }, 10000);
      }
    }
  }, [notifications, currentNotification]);

  const hideNotification = () => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentNotification(null);
    }, 300);
  };

  const handleDismiss = () => {
    if (currentNotification) {
      markAsReadMutation.mutate(currentNotification.id);
    }
    hideNotification();
  };

  const handleAcceptChallenge = () => {
    if (currentNotification?.data?.challengeId) {
      acceptChallengeMutation.mutate(currentNotification.data.challengeId);
    }
  };

  const handleAcceptFriendRequest = () => {
    if (currentNotification?.data?.friendRequestId) {
      acceptFriendRequestMutation.mutate(currentNotification.data.friendRequestId);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return 'fas fa-trophy';
      case 'challenge':
        return 'fas fa-swords';
      case 'event':
        return 'fas fa-calendar';
      case 'match':
        return 'fas fa-dice';
      case 'friend':
        return 'fas fa-user-friends';
      default:
        return 'fas fa-bell';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'achievement':
        return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900';
      case 'challenge':
        return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900';
      case 'event':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900';
      case 'match':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900';
      case 'friend':
        return 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900';
      default:
        return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700';
    }
  };

  if (!currentNotification) return null;

  return (
    <div 
      className={`fixed top-4 right-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-4 max-w-sm z-50 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(currentNotification.type)}`}>
          <i className={`${getNotificationIcon(currentNotification.type)} text-sm`}></i>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {currentNotification.title}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {currentNotification.message}
          </p>
          
          {/* Action buttons for interactive notifications */}
          {currentNotification.type === 'challenge' && currentNotification.data?.challengeId && (
            <div className="flex space-x-2 mt-3">
              <Button
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs px-2 py-1 h-6"
                onClick={handleAcceptChallenge}
                disabled={acceptChallengeMutation.isPending}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs px-2 py-1 h-6"
                onClick={handleDismiss}
              >
                Decline
              </Button>
            </div>
          )}
          
          {currentNotification.type === 'friend' && currentNotification.data?.friendRequestId && (
            <div className="flex space-x-2 mt-3">
              <Button
                size="sm"
                className="bg-primary text-white hover:bg-primary/90 text-xs px-2 py-1 h-6"
                onClick={handleAcceptFriendRequest}
                disabled={acceptFriendRequestMutation.isPending}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs px-2 py-1 h-6"
                onClick={handleDismiss}
              >
                Decline
              </Button>
            </div>
          )}
          
          {/* View button for other notification types */}
          {!['challenge', 'friend'].includes(currentNotification.type) && (
            <div className="flex space-x-2 mt-3">
              <Button
                size="sm"
                className="bg-primary text-white hover:bg-primary/90 text-xs px-2 py-1 h-6"
                onClick={() => {
                  if (currentNotification.type === 'event') {
                    window.location.href = '/events';
                  } else if (currentNotification.type === 'achievement') {
                    window.location.href = '/profile';
                  } else {
                    window.location.href = '/notifications';
                  }
                  handleDismiss();
                }}
              >
                View
              </Button>
            </div>
          )}
        </div>
        
        <button 
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex-shrink-0"
        >
          <i className="fas fa-times text-sm"></i>
        </button>
      </div>
    </div>
  );
}
