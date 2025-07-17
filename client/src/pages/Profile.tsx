
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { MobileNavigation } from "@/components/MobileNavigation";
import { MobileHeader } from "@/components/MobileHeader";
import MobileLayout, { MobileCard } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";
import { LevelBadge } from "@/components/LevelBadge";
import { LevelProgress } from "@/components/LevelProgress";
import { formatBalance } from "@/utils/currencyUtils";
import { getAvatarUrl } from "@/utils/avatarUtils";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
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

  const { data: achievements = [] } = useQuery({
    queryKey: ["/api/user/achievements"],
    retry: false,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/transactions"],
    retry: false,
  });

  if (!user) return null;

  // Calculate level progress
  const currentLevelXP = (user.level - 1) * 1000;
  const nextLevelXP = user.level * 1000;
  const progressXP = user.xp - currentLevelXP;
  const levelProgress = (progressXP / (nextLevelXP - currentLevelXP)) * 100;

  const getAchievementColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'first':
        return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300';
      case 'streak':
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300';
      case 'social':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300';
      case 'challenge':
        return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300';
      case 'event':
        return 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300';
      default:
        return 'bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-300';
    }
  };

  const getAchievementIcon = (icon: string, category: string) => {
    if (icon) return icon;

    switch (category?.toLowerCase()) {
      case 'first':
        return 'fas fa-star';
      case 'streak':
        return 'fas fa-fire';
      case 'social':
        return 'fas fa-users';
      case 'challenge':
        return 'fas fa-sword';
      case 'event':
        return 'fas fa-calendar-check';
      default:
        return 'fas fa-trophy';
    }
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <MobileLayout>
      <Navigation />
      <MobileHeader />

      {/* Mobile Profile Header - Cleaner Design */}
      <div className="md:hidden">
        {/* Profile Avatar and Name Section */}
        <div className="bg-white dark:bg-slate-800 p-6 mb-6 rounded-b-3xl">
          <div className="flex flex-col items-center text-center">
            <Avatar className="w-24 h-24 mb-4 ring-4 ring-primary/20">
              <AvatarImage 
                src={getAvatarUrl(user.id, user.profileImageUrl, user.firstName || user.username)} 
                alt={user.firstName || user.username || 'User'} 
              />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {(user.firstName?.[0] || user.username?.[0] || 'U').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {user.firstName || user.username}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-4">@{user.username}</p>
            
            <div className="flex items-center space-x-3">
              <Badge className="bg-primary/10 text-primary border-primary/20">
                Level {user.level}
              </Badge>
              <Badge variant="outline" className="text-slate-600">
                {user.xp} XP
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6 px-4">
          <MobileCard className="text-center py-6">
            <div className="text-2xl font-bold text-primary mb-1">
              {formatBalance(user.points || 0)}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Points</div>
          </MobileCard>
          
          <MobileCard className="text-center py-6">
            <div className="text-2xl font-bold text-emerald-600 mb-1">
              {userStats?.wins || 0}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Wins</div>
          </MobileCard>
          
          <MobileCard className="text-center py-6">
            <div className="text-2xl font-bold text-amber-600 mb-1">
              {user.streak}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Streak</div>
          </MobileCard>
          
          <MobileCard className="text-center py-6">
            <div className="text-2xl font-bold text-cyan-600 mb-1">
              {achievements.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Badges</div>
          </MobileCard>
        </div>

        {/* Quick Actions */}
        <div className="px-4 mb-6">
          <div className="grid grid-cols-3 gap-3">
            <Button 
              onClick={() => window.location.href = '/wallet'}
              className="flex flex-col items-center space-y-2 h-16 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
              variant="outline"
            >
              <i className="fas fa-wallet text-xl"></i>
              <span className="text-sm">Wallet</span>
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/settings'}
              className="flex flex-col items-center space-y-2 h-16 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300"
              variant="outline"
            >
              <i className="fas fa-cog text-xl"></i>
              <span className="text-sm">Settings</span>
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/history'}
              className="flex flex-col items-center space-y-2 h-16 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300"
              variant="outline"
            >
              <i className="fas fa-history text-xl"></i>
              <span className="text-sm">History</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Profile Header */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              <Avatar className="w-32 h-32">
                <AvatarImage 
                  src={getAvatarUrl(user.id, user.profileImageUrl, user.firstName || user.username)} 
                  alt={user.firstName || user.username || 'User'} 
                />
                <AvatarFallback className="text-2xl">
                  {(user.firstName?.[0] || user.username?.[0] || 'U').toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                      {user.firstName || user.username}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                      {user.email}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                      Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  <Button 
                    onClick={() => window.location.href = '/profile/settings'}
                    className="bg-primary text-white hover:bg-primary/90 mt-4 md:mt-0"
                  >
                    <i className="fas fa-edit mr-2"></i>
                    Edit Profile
                  </Button>
                </div>

                {/* Level Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Level {user.level}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {user.xp} / {nextLevelXP} XP
                    </span>
                  </div>
                  <Progress value={levelProgress} className="h-2" />
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{formatBalance(user.points || 0)}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Points</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">{userStats?.wins || 0}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Wins</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">{user.streak}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Streak</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cyan-600">{achievements.length}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Achievements</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Tabs */}
      <div className="px-4 md:px-0">
        <Tabs defaultValue="level" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800">
            <TabsTrigger value="level" className="text-sm rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">Level</TabsTrigger>
            <TabsTrigger value="achievements" className="text-sm rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">Badges</TabsTrigger>
            <TabsTrigger value="activity" className="text-sm rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">Activity</TabsTrigger>
            <TabsTrigger value="stats" className="text-sm rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="level" className="space-y-6">
            <MobileCard>
              <LevelProgress 
                level={user.level}
                currentXP={user.xp}
                totalXP={user.xp}
                recentGains={[]}
              />
            </MobileCard>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <MobileCard>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Your Badges
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {achievements.length} badges earned
                </p>
              </div>
              
              {achievements.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-trophy text-2xl text-slate-400"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No badges yet
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Start participating to unlock your first badge!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {achievements.map((achievement: any) => (
                    <div
                      key={achievement.id}
                      className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50"
                    >
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <i className={`${getAchievementIcon(achievement.icon, achievement.category)} text-primary text-lg`}></i>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {achievement.name}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {achievement.description}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          {formatDistanceToNow(new Date(achievement.unlockedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </MobileCard>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <MobileCard>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Recent Activity
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Your latest transactions
                </p>
              </div>
              
              {recentTransactions.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-history text-2xl text-slate-400"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No activity yet
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Your activities will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTransactions.map((transaction: any) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'deposit' || transaction.type === 'win' || transaction.type === 'referral'
                            ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                        }`}>
                          <i className={`fas ${
                            transaction.type === 'deposit' ? 'fa-plus' :
                            transaction.type === 'withdrawal' ? 'fa-minus' :
                            transaction.type === 'bet' ? 'fa-dice' :
                            transaction.type === 'win' ? 'fa-trophy' :
                            transaction.type === 'challenge' ? 'fa-swords' :
                            transaction.type === 'referral' ? 'fa-gift' :
                            'fa-circle'
                          } text-sm`}></i>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                            {transaction.type}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.type === 'deposit' || transaction.type === 'win' || transaction.type === 'referral'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'deposit' || transaction.type === 'win' || transaction.type === 'referral' ? '+' : '-'}
                          ₦{Math.abs(parseFloat(transaction.amount)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </MobileCard>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <MobileCard>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Performance Stats
                  </h3>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Total Wins</span>
                    <span className="text-2xl font-bold text-emerald-600">{userStats?.wins || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Current Streak</span>
                    <span className="text-2xl font-bold text-amber-600">{user.streak}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Active Challenges</span>
                    <span className="text-2xl font-bold text-cyan-600">{userStats?.activeChallenges || 0}</span>
                  </div>
                </div>
              </MobileCard>

              <MobileCard>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Account Info
                  </h3>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Member Since</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Referral Code</span>
                    <span className="font-mono text-sm bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg">
                      {user.referralCode || 'NONE'}
                    </span>
                  </div>
                </div>
              </MobileCard>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <MobileNavigation />
    </MobileLayout>
  );
}
