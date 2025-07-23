import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { MobileNavigation } from "@/components/MobileNavigation";
import ProfileCard from "@/components/ProfileCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Leaderboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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



  // Apply search filter
  const filteredUsers = leaderboard.filter((user: any) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const firstName = (user.firstName || '').toLowerCase();
    const lastName = (user.lastName || '').toLowerCase();
    const username = (user.username || '').toLowerCase();
    const fullName = `${firstName} ${lastName}`.trim();

    return firstName.includes(searchLower) ||
           lastName.includes(searchLower) ||
           username.includes(searchLower) ||
           fullName.includes(searchLower);
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition">


      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="hidden md:block text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Leaderboard 🏆
          </h1>
          <p className="hidden md:block text-slate-600 dark:text-slate-400">
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
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl">
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
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Search players..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 mb-3"
                    />
                    {filteredUsers.map((player: any, index: number) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 md:p-4 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                        onClick={() => setSelectedProfileUserId(player.id)}
                      >
                        <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0">
                          <div className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm md:text-lg font-bold text-slate-600 dark:text-slate-400">
                              {index + 1}
                            </span>
                          </div>

                          <div className="relative flex-shrink-0">
                            <UserAvatar
                              userId={player.id}
                              username={player.username}
                              size={32}
                              className="h-8 w-8 md:h-10 md:w-10"
                            />
                            {index === 0 && (
                              <div className="absolute -top-1 -left-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                                <span className="text-xs">⭐</span>
                              </div>
                            )}
                            {index === 1 && (
                              <div className="absolute -top-1 -left-1 w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center">
                                <span className="text-xs">⭐</span>
                              </div>
                            )}
                            {index === 2 && (
                              <div className="absolute -top-1 -left-1 w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center">
                                <span className="text-xs">⭐</span>
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-pink-400 rounded-full flex items-center justify-center">
                              <span className="text-xs">💎</span>
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm md:text-base text-slate-900 dark:text-slate-100 truncate">
                              {player.firstName ? `${player.firstName} ${player.lastName || ''}`.trim() : player.username}
                            </p>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 truncate">
                              {player.username}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
                          <div className="text-right">
                            <p className="font-bold text-base md:text-lg text-slate-900 dark:text-slate-100">
                              {player.points}
                            </p>
                          </div>

                          <div className="hidden md:flex items-center space-x-1">
                            <span className="text-sm text-red-500">🔥</span>
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                              NO
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="level">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl">
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
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl">
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

      {/* Profile Card Modal */}
      {selectedProfileUserId && (
        <ProfileCard 
          userId={selectedProfileUserId} 
          onClose={() => setSelectedProfileUserId(null)} 
        />
      )}
    </div>
  );
}