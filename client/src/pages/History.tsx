import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { MobileNavigation } from "@/components/MobileNavigation";
import MobileLayout from "@/components/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/UserAvatar";
import { formatDistanceToNow } from "date-fns";
import { formatBalance } from "@/utils/currencyUtils";
import {
  Star,
  Clock,
  MessageCircle,
  Trophy,
  AlertTriangle,
} from "lucide-react";

export default function History() {
  const { user } = useAuth();

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/events/user"],
    retry: false,
    enabled: !!user,
  });

  const { data: challenges = [], isLoading: challengesLoading } = useQuery({
    queryKey: ["/api/challenges/user"],
    retry: false,
    enabled: !!user,
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/wallet/transactions"],
    retry: false,
    enabled: !!user,
  });

  if (!user) return null;

  // Combine and categorize all activities
  const allActivities = [
    ...events.map((event: any) => ({ ...event, type: "event" })),
    ...challenges.map((challenge: any) => ({
      ...challenge,
      type: "challenge",
    })),
  ];

  const createdActivities = allActivities.filter(
    (activity) => activity.createdBy === user.id,
  );

  const activeActivities = allActivities.filter(
    (activity) => activity.status === "active" || activity.status === "live",
  );

  const discussActivities = allActivities.filter(
    (activity) => activity.chatEnabled || activity.type === "challenge",
  );

  const wonActivities = Array.isArray(transactions) ? transactions.filter(
    (tx: any) => tx.type === "win" || tx.type === "prize",
  ) : [];

  const lostActivities = Array.isArray(transactions) ? transactions.filter(
    (tx: any) => tx.type === "bet" || tx.type === "challenge_bet",
  ) : [];

  const getActivityImage = (activity: any) => {
    if (activity.type === "event") {
      return activity.image || "/assets/events-icon.png";
    }
    return "/assets/challenge-notification.mp3"; // Default challenge image
  };

  const getStatusBadge = (activity: any) => {
    const status = activity.status || "pending";
    const colors = {
      active: "bg-purple-500 text-white",
      live: "bg-green-500 text-white",
      pending: "bg-yellow-500 text-white",
      completed: "bg-blue-500 text-white",
      settled: "bg-gray-500 text-white",
    };
    return colors[status] || "bg-gray-500 text-white";
  };

  const ActivityCard = ({ activity }: { activity: any }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100">
              <img
                src={getActivityImage(activity)}
                alt={activity.title || activity.description}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/assets/events-icon.png";
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {activity.title || activity.description}
                </h3>
                <Badge className={`text-xs ${getStatusBadge(activity)}`}>
                  {activity.status || "pending"}
                </Badge>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <span>By</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {formatDistanceToNow(new Date(activity.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Trophy className="w-3 h-3" />
                  <span>{activity.participantsCount || 0}</span>
                </div>
              </div>

              <div className="mt-2">
                <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                  {formatBalance(activity.entryFee || activity.betAmount || 0)}{" "}
                  Pool
                </span>
              </div>
            </div>
          </div>

          <Button
            className="ml-4"
            style={{ backgroundColor: "#7440ff", color: "white" }}
            size="sm"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const TransactionCard = ({ transaction }: { transaction: any }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              {transaction.type === "win" || transaction.type === "prize" ? (
                <Trophy className="w-6 h-6 text-green-500" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-500" />
              )}
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {transaction.description || `${transaction.type} transaction`}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatDistanceToNow(new Date(transaction.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`font-semibold text-lg ${
                transaction.type === "win" || transaction.type === "prize"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {transaction.type === "win" || transaction.type === "prize"
                ? "+"
                : "-"}
              {formatBalance(transaction.amount)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <MobileLayout>
      <Navigation />

      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Tabs defaultValue="created" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger
                value="created"
                className="flex items-center space-x-1"
              >
                <Star className="w-4 h-4" />
                <span className="hidden sm:inline">Created</span>
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="flex items-center space-x-1"
              >
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Active</span>
              </TabsTrigger>
              <TabsTrigger
                value="discuss"
                className="flex items-center space-x-1"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Discuss</span>
              </TabsTrigger>
              <TabsTrigger value="won" className="flex items-center space-x-1">
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Won</span>
              </TabsTrigger>
              <TabsTrigger value="lost" className="flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Lost</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="created">
              <div>
                {createdActivities.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No created activities yet
                    </p>
                  </div>
                ) : (
                  createdActivities.map((activity: any) => (
                    <ActivityCard
                      key={`${activity.type}-${activity.id}`}
                      activity={activity}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="active">
              <div>
                {activeActivities.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No active activities
                    </p>
                  </div>
                ) : (
                  activeActivities.map((activity: any) => (
                    <ActivityCard
                      key={`${activity.type}-${activity.id}`}
                      activity={activity}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="discuss">
              <div>
                {discussActivities.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No discussions available
                    </p>
                  </div>
                ) : (
                  discussActivities.map((activity: any) => (
                    <ActivityCard
                      key={`${activity.type}-${activity.id}`}
                      activity={activity}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="won">
              <div>
                {wonActivities.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No winnings yet
                    </p>
                  </div>
                ) : (
                  wonActivities.map((transaction: any) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="lost">
              <div>
                {lostActivities.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No losses recorded
                    </p>
                  </div>
                ) : (
                  lostActivities.map((transaction: any) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <MobileNavigation />
    </MobileLayout>
  );
}
