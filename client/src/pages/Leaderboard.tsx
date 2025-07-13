import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { MobileNavigation } from "@/components/MobileNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Leaderboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);

  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ["/api/leaderboard"],
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-amber-600 dark:text-amber-400';
      case 2:
        return 'text-slate-600 dark:text-slate-400';
      case 3:
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-slate-700 dark:text-slate-300';
    }
  };

  const currentUserRank = leaderboard.findIndex((player: any) => player.id === user?.id) + 1;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Leaderboard 🏆
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            See how you rank against other players
          </p>
        </div>

        {/* Your Rank Card */}
        {currentUserRank > 0 && (
          <Card className="bg-gradient-to-br from-primary to-secondary text-white mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    currentUserRank <= 3 ? 'bg-white text-primary' : 'bg-primary-700 text-white'
                  }`}>
                    {getRankIcon(currentUserRank)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Your Rank</h3>
                    <p className="text-primary-100">
                      {user.points} points • Level {user.level}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">#{currentUserRank}</p>
                  <p className="text-primary-100 text-sm">of {leaderboard.length} players</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Tabs */}
        <Tabs defaultValue="points" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="points">Points</TabsTrigger>
            <TabsTrigger value="level">Level</TabsTrigger>
            <TabsTrigger value="wins">Wins</TabsTrigger>
          </TabsList>

          <TabsContent value="points">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle>Top Players by Points</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Loading leaderboard...</p>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-trophy text-4xl text-slate-400 mb-4"></i>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      No rankings yet
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Start playing to appear on the leaderboard!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leaderboard.slice(0, 50).map((player: any, index: number) => {
                      const rank = index + 1;
                      const isCurrentUser = player.id === user.id;

                      return (
                        <div
                          key={player.id}
                          className={`flex items-center justify-between p-4 rounded-lg border ${
                            isCurrentUser
                              ? 'border-primary bg-primary/5 dark:bg-primary/10'
                              : 'border-slate-200 dark:border-slate-600'
                          } ${rank <= 3 ? 'bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-700' : ''}`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                              rank === 1 ? 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400' :
                              rank === 2 ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400' :
                              rank === 3 ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400' :
                              'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                              {getRankIcon(rank)}
                            </div>
                            <Avatar 
                              className="w-12 h-12 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                              onClick={() => setSelectedProfileUserId(player.id)}
                            >
                              <AvatarImage 
                                src={player.profileImageUrl || undefined} 
                                alt={player.firstName || player.username || 'Player'} 
                              />
                              <AvatarFallback>
                                {(player.firstName?.[0] || player.username?.[0] || 'P').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className={`font-semibold ${isCurrentUser ? 'text-primary' : 'text-slate-900 dark:text-slate-100'}`}>
                                  {player.firstName || player.username}
                                  {isCurrentUser && <span className="text-sm text-primary ml-2">(You)</span>}
                                </h3>
                                {rank <= 3 && (
                                  <Badge className={
                                    rank === 1 ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300' :
                                    rank === 2 ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' :
                                    'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                                  }>
                                    {rank === 1 ? 'Champion' : rank === 2 ? 'Runner-up' : 'Third Place'}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Level {player.level} • {player.xp} XP
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${getRankColor(rank)}`}>
                              {player.points.toLocaleString()}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">points</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="level">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle>Top Players by Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <i className="fas fa-level-up-alt text-4xl text-slate-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Coming Soon
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Level-based rankings will be available soon!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wins">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle>Top Players by Wins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <i className="fas fa-trophy text-4xl text-slate-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Coming Soon
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Win-based rankings will be available soon!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <MobileNavigation />
    </div>
  );
}