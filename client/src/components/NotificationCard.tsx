import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";
import { useState } from "react";
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Users, 
  Flame, 
  Crown,
  Gift,
  ChevronRight
} from "lucide-react";

interface NotificationCardProps {
  notification: any;
  onMarkAsRead?: (id: number) => void;
}

export function NotificationCard({ notification, onMarkAsRead }: NotificationCardProps) {
  const { handleNotificationAction } = useNotifications();
  const [, navigate] = useLocation();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'leaderboard_leader':
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'winner_challenge':
        return <Crown className="w-5 h-5 text-purple-500" />;
      case 'loser_encourage':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'event_joiner':
        return <Users className="w-5 h-5 text-green-500" />;
      case 'streak_performer':
        return <Flame className="w-5 h-5 text-orange-500" />;
      default:
        return <Gift className="w-5 h-5 text-primary" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'leaderboard_leader':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'winner_challenge':
        return 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/20';
      case 'loser_encourage':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'event_joiner':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'streak_performer':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
      default:
        return 'border-l-primary bg-primary/5';
    }
  };

  const handleActionClick = async (action: string) => {
    try {
      const response = await handleNotificationAction({
        notificationId: notification.id,
        action,
        targetUserId: notification.data?.targetUserId,
        eventId: notification.data?.eventId,
      });

      // Handle different action responses
      if (response?.action === 'open_challenge_dialog' || response?.action === 'navigate_to_challenges') {
        navigate('/challenges');
      } else if (response?.action === 'navigate_to_event') {
        navigate(`/events/${response.eventId}`);
      }

      // Mark as read
      if (onMarkAsRead) {
        onMarkAsRead(notification.id);
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  };

  const getActionButton = (notificationType: string, data: any) => {
    switch (notificationType) {
      case 'leaderboard_leader':
        return (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={() => handleActionClick('challenge_user')}
          >
            <Target className="w-4 h-4 mr-1" />
            Challenge
          </Button>
        );
      case 'winner_challenge':
        return (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto bg-purple-50 hover:bg-purple-100 border-purple-200"
            onClick={() => handleActionClick('create_challenges')}
          >
            <Crown className="w-4 h-4 mr-1" />
            Create Challenges
          </Button>
        );
      case 'loser_encourage':
        return (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto bg-blue-50 hover:bg-blue-100 border-blue-200"
            onClick={() => handleActionClick('challenge_user')}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Get Redemption
          </Button>
        );
      case 'event_joiner':
        return (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto bg-green-50 hover:bg-green-100 border-green-200"
            onClick={() => handleActionClick('join_event')}
          >
            <Users className="w-4 h-4 mr-1" />
            Join Event
          </Button>
        );
      case 'streak_performer':
        return (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto bg-orange-50 hover:bg-orange-100 border-orange-200"
            onClick={() => handleActionClick('challenge_user')}
          >
            <Flame className="w-4 h-4 mr-1" />
            Challenge
          </Button>
        );
      default:
        return (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => handleActionClick('view')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        );
    }
  };

  const formatNotificationText = (message: string) => {
    // Replace @username with styled badges
    return message.replace(/@(\w+)/g, (match, username) => {
      return `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">@${username}</span>`;
    });
  };

  return (
    <>
      <Card className={`border-l-4 ${getNotificationColor(notification.type)} ${!notification.read ? 'ring-2 ring-primary/20' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {getNotificationIcon(notification.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {notification.title}
                </h4>
                {!notification.read && (
                  <Badge variant="secondary" className="ml-2 h-2 w-2 p-0 bg-primary rounded-full" />
                )}
              </div>
              
              <p 
                className="text-sm text-slate-600 dark:text-slate-400 mb-3 leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: formatNotificationText(notification.message) 
                }}
              />
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
                
                {getActionButton(notification.type, notification.data)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </>
  );
}