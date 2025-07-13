import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { MobileNavigation } from "@/components/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";

export default function Friends() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [friendEmail, setFriendEmail] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: friends = [], isLoading } = useQuery({
    queryKey: ["/api/friends"],
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

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (addresseeId: string) => {
      await apiRequest("POST", "/api/friends/request", { addresseeId });
    },
    onSuccess: () => {
      toast({
        title: "Friend Request Sent",
        description: "Your friend request has been sent!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      setIsAddDialogOpen(false);
      setFriendEmail("");
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

  const acceptFriendRequestMutation = useMutation({
    mutationFn: async (friendId: number) => {
      await apiRequest("PATCH", `/api/friends/${friendId}/accept`);
    },
    onSuccess: () => {
      toast({
        title: "Friend Request Accepted",
        description: "You are now friends!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
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

  const acceptedFriends = friends.filter((f: any) => f.status === "accepted");
  const pendingRequests = friends.filter((f: any) => f.status === "pending" && f.addresseeId === user?.id);
  const sentRequests = friends.filter((f: any) => f.status === "pending" && f.requesterId === user?.id);

  const getFriendUser = (friend: any) => {
    return friend.requesterId === user?.id ? friend.addressee : friend.requester;
  };

  const handleSendRequest = () => {
    // In a real app, you'd search for users by email first
    // For now, we'll simulate with a placeholder
    if (friendEmail.trim()) {
      // This would normally be the found user's ID
      sendFriendRequestMutation.mutate("placeholder-user-id");
    }
  };

  if (!user) return null;

    const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/users"],
    retry: false,
  });

  const filteredUsers = allUsers.filter((u: any) => {
    if (u.id === user?.id) return false;
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const firstName = (u.firstName || '').toLowerCase();
    const lastName = (u.lastName || '').toLowerCase();
    const username = (u.username || '').toLowerCase();
    const fullName = `${firstName} ${lastName}`.trim();

    return firstName.includes(searchLower) ||
           lastName.includes(searchLower) ||
           username.includes(searchLower) ||
           fullName.includes(searchLower);
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Friends 👥
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Connect with friends and challenge them
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white hover:bg-primary/90 mt-4 sm:mt-0">
                <i className="fas fa-user-plus mr-2"></i>
                Add Friend
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Friend</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Friend's Email or Username</label>
                  <Input
                    type="text"
                    placeholder="Enter email or username..."
                    value={friendEmail}
                    onChange={(e) => setFriendEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendRequest}
                    disabled={!friendEmail.trim() || sendFriendRequestMutation.isPending}
                    className="flex-1 bg-primary text-white hover:bg-primary/90"
                  >
                    {sendFriendRequestMutation.isPending ? "Sending..." : "Send Request"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-8">
          <CardContent className="p-6">
            <Input
              placeholder="Search friends..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 dark:bg-slate-700"
            />
          </CardContent>
        </Card>

        {/* Friends Tabs */}
        <Tabs defaultValue="friends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">
              Friends ({acceptedFriends.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              Requests ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent ({sentRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading friends...</p>
              </div>
            ) : acceptedFriends.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="text-center py-12">
                  <i className="fas fa-user-friends text-4xl text-slate-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No friends yet
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Add friends to start challenging them!
                  </p>
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    <i className="fas fa-user-plus mr-2"></i>
                    Add Your First Friend
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {acceptedFriends.map((friend: any) => {
                  const friendUser = getFriendUser(friend);
                  return (
                    <Card key={friend.id} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage 
                              src={friendUser.profileImageUrl || undefined} 
                              alt={friendUser.firstName || friendUser.username} 
                            />
                            <AvatarFallback>
                              {(friendUser.firstName?.[0] || friendUser.username?.[0] || 'F').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                              {friendUser.firstName || friendUser.username}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Friends since {formatDistanceToNow(new Date(friend.acceptedAt), { addSuffix: true })}
                            </p>
                          </div>
                          <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                            Online
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            className="flex-1 bg-primary text-white hover:bg-primary/90"
                            onClick={() => window.location.href = '/challenges'}
                          >
                            <i className="fas fa-swords mr-1"></i>
                            Challenge
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <i className="fas fa-comment mr-1"></i>
                            Message
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {pendingRequests.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="text-center py-12">
                  <i className="fas fa-inbox text-4xl text-slate-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No friend requests
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    When people send you friend requests, they'll appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map((request: any) => {
                const requesterUser = request.requester;
                return (
                  <Card key={request.id} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage 
                              src={requesterUser.profileImageUrl || undefined} 
                              alt={requesterUser.firstName || requesterUser.username} 
                            />
                            <AvatarFallback>
                              {(requesterUser.firstName?.[0] || requesterUser.username?.[0] || 'F').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                              {requesterUser.firstName || requesterUser.username}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Sent {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={() => acceptFriendRequestMutation.mutate(request.id)}
                            disabled={acceptFriendRequestMutation.isPending}
                          >
                            Accept
                          </Button>
                          <Button size="sm" variant="outline">
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            {sentRequests.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="text-center py-12">
                  <i className="fas fa-paper-plane text-4xl text-slate-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No sent requests
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Friend requests you send will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              sentRequests.map((request: any) => {
                const addresseeUser = request.addressee;
                return (
                  <Card key={request.id} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage 
                              src={addresseeUser.profileImageUrl || undefined} 
                              alt={addresseeUser.firstName || addresseeUser.username} 
                            />
                            <AvatarFallback>
                              {(addresseeUser.firstName?.[0] || addresseeUser.username?.[0] || 'F').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                              {addresseeUser.firstName || addresseeUser.username}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Sent {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
                          Pending
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      <MobileNavigation />
    </div>
  );
}