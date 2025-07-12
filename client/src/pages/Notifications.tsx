import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { MobileNavigation } from "@/components/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["/api/notifications"],
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

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
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

  const unreadNotifications = notifications.filter((n: any) => !n.read);
  const readNotifications = notifications.filter((n: any) => n.read);

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Notifications 🔔
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Stay updated with your latest activities
            </p>
          </div>
          
          {unreadNotifications.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                unreadNotifications.forEach((notification: any) => {
                  handleMarkAsRead(notification.id);
                });
              }}
              disabled={markAsReadMutation.isPending}
            >
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Notifications Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread ({unreadNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="read">
              Read ({readNotifications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="text-center py-12">
                  <i className="fas fa-bell-slash text-4xl text-slate-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No notifications yet
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    We'll notify you when something interesting happens!
                  </p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification: any) => (
                <Card
                  key={notification.id}
                  className={`bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 ${
                    !notification.read ? 'ring-2 ring-primary/20' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                        <i className={`${getNotificationIcon(notification.type)} text-sm`}></i>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                              {notification.title}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {!notification.read && (
                              <>
                                <Badge className="bg-primary text-white">New</Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  disabled={markAsReadMutation.isPending}
                                >
                                  <i className="fas fa-check text-xs"></i>
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Action buttons based on notification type */}
                        {notification.type === 'challenge' && notification.data?.challengeId && (
                          <div className="mt-3 flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-emerald-600 text-white hover:bg-emerald-700"
                              onClick={() => window.location.href = '/challenges'}
                            >
                              View Challenge
                            </Button>
                          </div>
                        )}
                        
                        {notification.type === 'friend' && notification.data?.friendRequestId && (
                          <div className="mt-3 flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-primary text-white hover:bg-primary/90"
                              onClick={() => window.location.href = '/friends'}
                            >
                              View Request
                            </Button>
                          </div>
                        )}
                        
                        {notification.type === 'event' && notification.data?.eventId && (
                          <div className="mt-3 flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-blue-600 text-white hover:bg-blue-700"
                              onClick={() => window.location.href = '/events'}
                            >
                              View Event
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="unread" className="space-y-4">
            {unreadNotifications.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="text-center py-12">
                  <i className="fas fa-check-circle text-4xl text-emerald-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    All caught up!
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    You have no unread notifications.
                  </p>
                </CardContent>
              </Card>
            ) : (
              unreadNotifications.map((notification: any) => (
                <Card
                  key={notification.id}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 ring-2 ring-primary/20"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                        <i className={`${getNotificationIcon(notification.type)} text-sm`}></i>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                              {notification.title}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <Badge className="bg-primary text-white">New</Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkAsRead(notification.id)}
                              disabled={markAsReadMutation.isPending}
                            >
                              <i className="fas fa-check text-xs"></i>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="read" className="space-y-4">
            {readNotifications.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="text-center py-12">
                  <i className="fas fa-history text-4xl text-slate-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No read notifications
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Notifications you've read will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              readNotifications.map((notification: any) => (
                <Card
                  key={notification.id}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-75"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                        <i className={`${getNotificationIcon(notification.type)} text-sm`}></i>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <MobileNavigation />
    </div>
  );
}
