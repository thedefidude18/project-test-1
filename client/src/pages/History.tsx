import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { MobileNavigation } from "@/components/MobileNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";

export default function History() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
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

  const { data: challenges = [], isLoading: challengesLoading } = useQuery({
    queryKey: ["/api/challenges"],
    retry: false,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/events"],
    retry: false,
  });

  // Get user's created events
  const { data: createdEvents = [], isLoading: createdEventsLoading } = useQuery({
    queryKey: ["/api/user/created-events"],
    retry: false,
  });

  // Get user's joined events (participated in)
  const { data: joinedEvents = [], isLoading: joinedEventsLoading } = useQuery({
    queryKey: ["/api/user/joined-events"],
    retry: false,
  });

  // Get user's created challenges
  const createdChallenges = challenges.filter((c: any) => c.challenger === user?.id);
  
  // Get user's received challenges
  const receivedChallenges = challenges.filter((c: any) => c.challenged === user?.id);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return 'fas fa-plus-circle';
      case 'withdrawal': return 'fas fa-minus-circle';
      case 'bet': return 'fas fa-dice';
      case 'win': return 'fas fa-trophy';
      case 'challenge': return 'fas fa-swords';
      case 'referral': return 'fas fa-gift';
      default: return 'fas fa-circle';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'win':
      case 'referral':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900';
      case 'withdrawal':
      case 'bet':
      case 'challenge':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900';
      default:
        return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700';
    }
  };

  const getTransactionPrefix = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'win':
      case 'referral':
        return '+';
      case 'withdrawal':
      case 'bet':
      case 'challenge':
        return '-';
      default:
        return '';
    }
  };

  const filteredTransactions = transactions.filter((transaction: any) => {
    const matchesSearch = transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const completedChallenges = challenges.filter((c: any) => c.status === "completed");

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            History 📊
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            View your transaction history and past activities
          </p>
        </div>

        {/* Filters */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-700"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                  <SelectItem value="bet">Bets</SelectItem>
                  <SelectItem value="win">Wins</SelectItem>
                  <SelectItem value="challenge">Challenges</SelectItem>
                  <SelectItem value="referral">Referrals</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* History Tabs */}
        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="transactions">
              Transactions ({transactions.length})
            </TabsTrigger>
            <TabsTrigger value="events-created">
              Events Created ({createdEvents.length})
            </TabsTrigger>
            <TabsTrigger value="events-joined">
              Events Joined ({joinedEvents.length})
            </TabsTrigger>
            <TabsTrigger value="challenges-created">
              Challenges Created ({createdChallenges.length})
            </TabsTrigger>
            <TabsTrigger value="challenges-received">
              Challenges Received ({receivedChallenges.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Loading transactions...</p>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-receipt text-4xl text-slate-400 mb-4"></i>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      {searchTerm || typeFilter !== "all" ? "No matching transactions" : "No transactions yet"}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {searchTerm || typeFilter !== "all" 
                        ? "Try adjusting your filters to see more transactions."
                        : "Your transaction history will appear here once you start using your wallet."
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTransactions.map((transaction: any) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionColor(transaction.type)}`}>
                            <i className={`${getTransactionIcon(transaction.type)} text-sm`}></i>
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                              {transaction.type}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {transaction.description || `${transaction.type} transaction`}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                              {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-semibold ${
                            transaction.type === 'deposit' || transaction.type === 'win' || transaction.type === 'referral'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {getTransactionPrefix(transaction.type)}₦{Math.abs(parseFloat(transaction.amount)).toLocaleString()}
                          </p>
                          <Badge
                            className={
                              transaction.status === 'completed'
                                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                                : transaction.status === 'pending'
                                ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                                : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events-created" className="space-y-4">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle>Events You Created</CardTitle>
              </CardHeader>
              <CardContent>
                {createdEventsLoading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Loading events...</p>
                  </div>
                ) : createdEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-calendar-plus text-4xl text-slate-400 mb-4"></i>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      No events created yet
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Events you create will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {createdEvents.map((event: any) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 dark:text-slate-100">
                            {event.title}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                            {event.category} • Pool: ₦{parseFloat(event.eventPool || "0").toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            Created {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₦{parseFloat(event.entryFee).toLocaleString()}</p>
                          <Badge
                            className={
                              event.status === 'completed'
                                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                                : event.status === 'active'
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                            }
                          >
                            {event.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events-joined" className="space-y-4">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle>Events You Joined</CardTitle>
              </CardHeader>
              <CardContent>
                {joinedEventsLoading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Loading events...</p>
                  </div>
                ) : joinedEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-calendar-check text-4xl text-slate-400 mb-4"></i>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      No events joined yet
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Events you participate in will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {joinedEvents.map((event: any) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 dark:text-slate-100">
                            {event.title}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                            {event.category} • Predicted: {event.prediction ? 'Yes' : 'No'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            Joined {formatDistanceToNow(new Date(event.joinedAt), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₦{parseFloat(event.amount).toLocaleString()}</p>
                          <Badge
                            className={
                              event.status === 'won'
                                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                                : event.status === 'lost'
                                ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                                : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                            }
                          >
                            {event.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="challenges-created" className="space-y-4">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle>Challenges You Created</CardTitle>
              </CardHeader>
              <CardContent>
                {challengesLoading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Loading challenges...</p>
                  </div>
                ) : createdChallenges.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-sword text-4xl text-slate-400 mb-4"></i>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      No challenges created
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Challenges you create will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {createdChallenges.map((challenge: any) => (
                      <div
                        key={challenge.id}
                        className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 dark:text-slate-100">
                            {challenge.title}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            vs {challenge.challengedUser?.firstName || challenge.challengedUser?.username || 'Unknown'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            Created {formatDistanceToNow(new Date(challenge.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₦{parseFloat(challenge.amount).toLocaleString()}</p>
                          <Badge
                            className={
                              challenge.result === 'challenger_won'
                                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                                : challenge.result === 'challenged_won'
                                ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                                : challenge.result === 'draw'
                                ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                                : challenge.status === 'completed'
                                ? 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                                : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            }
                          >
                            {challenge.result || challenge.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="challenges-received" className="space-y-4">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle>Challenges You Received</CardTitle>
              </CardHeader>
              <CardContent>
                {challengesLoading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Loading challenges...</p>
                  </div>
                ) : receivedChallenges.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-swords text-4xl text-slate-400 mb-4"></i>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      No challenges received
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Challenges sent to you will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {receivedChallenges.map((challenge: any) => (
                      <div
                        key={challenge.id}
                        className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 dark:text-slate-100">
                            {challenge.title}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            from {challenge.challengerUser?.firstName || challenge.challengerUser?.username || 'Unknown'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            Received {formatDistanceToNow(new Date(challenge.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₦{parseFloat(challenge.amount).toLocaleString()}</p>
                          <Badge
                            className={
                              challenge.result === 'challenged_won'
                                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                                : challenge.result === 'challenger_won'
                                ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                                : challenge.result === 'draw'
                                ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                                : challenge.status === 'completed'
                                ? 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                                : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            }
                          >
                            {challenge.result || challenge.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </div>

      <MobileNavigation />
    </div>
  );
}
