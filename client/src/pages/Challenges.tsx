import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { MobileNavigation } from "@/components/MobileNavigation";
import { ChallengeCard } from "@/components/ChallengeCard";
import { ChallengeChat } from "@/components/ChallengeChat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { MessageCircle, Clock, Trophy, TrendingUp, Zap, Users, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const createChallengeSchema = z.object({
  challenged: z.string().min(1, "Please select who to challenge"),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  amount: z.string().min(1, "Stake amount is required"),
  dueDate: z.string().optional(),
});

export default function Challenges() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [preSelectedUser, setPreSelectedUser] = useState<any>(null);

  const form = useForm<z.infer<typeof createChallengeSchema>>({
    resolver: zodResolver(createChallengeSchema),
    defaultValues: {
      challenged: "",
      title: "",
      description: "",
      category: "",
      amount: "",
      dueDate: "",
    },
  });

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ["/api/challenges"],
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

  const { data: friends = [] } = useQuery({
    queryKey: ["/api/friends"],
    retry: false,
  });

  const { data: allUsers = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["/api/users"],
    retry: false,
    onError: (error: Error) => {
      console.error('Error fetching users:', error);
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

  const { data: balance = 0 } = useQuery({
    queryKey: ["/api/wallet/balance"],
    retry: false,
  });

  const createChallengeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createChallengeSchema>) => {
      const challengeData = {
        ...data,
        amount: data.amount, // Keep as string for backend validation
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined
      };
      await apiRequest("POST", "/api/challenges", challengeData);
    },
    onSuccess: () => {
      toast({
        title: "Challenge Created",
        description: "Your challenge has been sent!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      setIsCreateDialogOpen(false);
      setPreSelectedUser(null);
      form.reset();
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

  const categories = [
    { value: "gaming", label: "Gaming", icon: "fas fa-gamepad" },
    { value: "sports", label: "Sports", icon: "fas fa-dumbbell" },
    { value: "trading", label: "Trading", icon: "fas fa-chart-line" },
    { value: "fitness", label: "Fitness", icon: "fas fa-running" },
    { value: "skill", label: "Skill", icon: "fas fa-brain" },
    { value: "other", label: "Other", icon: "fas fa-star" },
  ];

  const filteredChallenges = challenges.filter((challenge: any) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (challenge.title || '').toLowerCase().includes(searchLower) ||
      (challenge.description || '').toLowerCase().includes(searchLower) ||
      (challenge.category || '').toLowerCase().includes(searchLower) ||
      (challenge.challengerUser?.username || '').toLowerCase().includes(searchLower) ||
      (challenge.challengedUser?.username || '').toLowerCase().includes(searchLower)
    );
  });

  const pendingChallenges = filteredChallenges.filter((c: any) => c.status === "pending");
  const activeChallenges = filteredChallenges.filter((c: any) => c.status === "active");
  const completedChallenges = filteredChallenges.filter((c: any) => c.status === "completed");

  const onSubmit = (data: z.infer<typeof createChallengeSchema>) => {
    const amount = parseFloat(data.amount);
    const currentBalance = typeof balance === 'object' ? balance.balance : balance;

    if (amount > currentBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough funds to create this challenge.",
        variant: "destructive",
      });
      return;
    }

    createChallengeMutation.mutate(data);
  };

  const handleChallengeClick = (challenge: any) => {
    setSelectedChallenge(challenge);
    setShowChat(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'disputed': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'active': return Zap;
      case 'completed': return Trophy;
      case 'disputed': return Shield;
      default: return Clock;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div className="hidden md:block">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Challenges ⚔️
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Challenge friends and prove your skills
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setPreSelectedUser(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white hover:bg-primary/90 mt-4 sm:mt-0">
                <i className="fas fa-plus mr-2"></i>
                Create Challenge
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {preSelectedUser 
                    ? `Challenge ${preSelectedUser.firstName || preSelectedUser.username}` 
                    : 'Create New Challenge'
                  }
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {!preSelectedUser && (
                    <FormField
                      control={form.control}
                      name="challenged"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Challenge Friend</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a friend" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {friends.map((friend: any) => {
                                const friendUser = friend.requesterId === user.id ? friend.addressee : friend.requester;
                                return (
                                  <SelectItem key={friendUser.id} value={friendUser.id}>
                                    {friendUser.firstName || friendUser.username}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {preSelectedUser && (
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {(preSelectedUser.firstName || preSelectedUser.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {preSelectedUser.firstName || preSelectedUser.username}
                        </p>
                        <p className="text-xs text-slate-500">
                          Level {preSelectedUser.level || 1} • {preSelectedUser.points || 0} points
                        </p>
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Challenge Title</FormLabel>
                        <FormControl>
                          <Input placeholder="What's the challenge?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe the challenge details..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                <div className="flex items-center space-x-2">
                                  <i className={category.icon}></i>
                                  <span>{category.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stake Amount (₦)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field}
                            min={new Date().toISOString().slice(0, 16)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createChallengeMutation.isPending}
                      className="flex-1 bg-primary text-white hover:bg-primary/90"
                    >
                      {createChallengeMutation.isPending ? "Creating..." : "Send Challenge"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-8">
          <CardContent className="p-6">
            <Input
              placeholder="Search challenges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 dark:bg-slate-700"
            />
          </CardContent>
        </Card>

        {/* Challenges Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">
              Pending ({pendingChallenges.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({activeChallenges.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedChallenges.length})
            </TabsTrigger>
            <TabsTrigger value="users">
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading challenges...</p>
              </div>
            ) : pendingChallenges.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="text-center py-12">
                  <i className="fas fa-clock text-4xl text-slate-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No pending challenges
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Challenge your friends to start competing!
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingChallenges.map((challenge: any) => (
                <ChallengeCard key={challenge.id} challenge={challenge} onChatClick={handleChallengeClick} />
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeChallenges.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="text-center py-12">
                  <i className="fas fa-fire text-4xl text-slate-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No active challenges
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Accept pending challenges to get started!
                  </p>
                </CardContent>
              </Card>
            ) : (
              activeChallenges.map((challenge: any) => (
                <ChallengeCard key={challenge.id} challenge={challenge} onChatClick={handleChallengeClick} />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedChallenges.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="text-center py-12">
                  <i className="fas fa-trophy text-4xl text-slate-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No completed challenges
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Complete some challenges to see them here!
                  </p>
                </CardContent>
              </Card>
            ) : (
              completedChallenges.map((challenge: any) => (
                <ChallengeCard key={challenge.id} challenge={challenge} onChatClick={handleChallengeClick} />
              ))
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="mb-4">
              <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                <Input
                  placeholder="Search friends to challenge..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="pl-12 h-12 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 rounded-2xl"
                />
              </div>
            </div>

            {usersLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading users...</p>
              </div>
            ) : usersError ? (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="text-center py-12">
                  <i className="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Error loading users
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Unable to fetch users. Please try refreshing the page.
                  </p>
                </CardContent>
              </Card>
            ) : allUsers.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="text-center py-12">
                  <i className="fas fa-users text-4xl text-slate-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No users found
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    No users are currently available to challenge!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {allUsers
                  .filter((u: any) => u.id !== user?.id)
                  .filter((u: any) => {
                    if (!userSearchTerm) return true;
                    const searchLower = userSearchTerm.toLowerCase();
                    const firstName = (u.firstName || '').toLowerCase();
                    const lastName = (u.lastName || '').toLowerCase();
                    const username = (u.username || '').toLowerCase();
                    const fullName = `${firstName} ${lastName}`.trim();

                    return firstName.includes(searchLower) ||
                           lastName.includes(searchLower) ||
                           username.includes(searchLower) ||
                           fullName.includes(searchLower);
                  })
                  .map((userItem: any) => {
                    // Check if this user is a friend
                    const isFriend = friends.some((friend: any) => {
                      const friendUser = friend.requesterId === user.id ? friend.addressee : friend.requester;
                      return friendUser.id === userItem.id;
                    });

                    return (
                      <div key={userItem.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold relative">
                            {(userItem.firstName?.[0] || userItem.username?.[0] || 'U').toUpperCase()}
                            {isFriend && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                {userItem.firstName || userItem.username || 'Anonymous'}
                              </h3>
                              <span className="text-slate-500 dark:text-slate-400 text-sm">
                                @{userItem.username || 'unknown'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                              <span className="flex items-center">
                                <i className="fas fa-trophy mr-1 text-amber-500"></i>
                                {userItem.wins || 0}
                              </span>
                              <span className="flex items-center">
                                <i className="fas fa-bolt mr-1 text-purple-500"></i>
                                {userItem.level || 1}
                              </span>
                              <span className="flex items-center">
                                <i className="fas fa-naira-sign mr-1 text-green-500"></i>
                                {userItem.balance || 'N0'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 py-2 font-medium"
                          onClick={() => {
                            form.setValue('challenged', userItem.id);
                            setPreSelectedUser(userItem);
                            setIsCreateDialogOpen(true);
                          }}
                        >
                          Challenge
                        </Button>
                      </div>
                    );
                  })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Challenge Chat Dialog */}
      {showChat && selectedChallenge && (
        <Dialog open={showChat} onOpenChange={setShowChat}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] p-0">
            <ChallengeChat 
              challenge={selectedChallenge} 
              onClose={() => setShowChat(false)} 
            />
          </DialogContent>
        </Dialog>
      )}

      <MobileNavigation />
    </div>
  );
}