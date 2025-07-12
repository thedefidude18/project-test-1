import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { MobileNavigation } from "@/components/MobileNavigation";
import { EventCard } from "@/components/EventCard";
import { ChallengeCard } from "@/components/ChallengeCard";
import { LiveChat } from "@/components/LiveChat";
import { AchievementsList } from "@/components/AchievementsList";
import { NotificationToast } from "@/components/NotificationToast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotifications } from "@/hooks/useNotifications";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { notifications, unreadCount } = useNotifications();

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/events"],
    retry: false,
  });

  const { data: challenges = [], isLoading: challengesLoading } = useQuery({
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
        return;
      }
    },
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
    retry: false,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
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
  }, [user, authLoading, toast]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-primary via-secondary to-primary rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Welcome back, {user.firstName || user.username}! 🎯
              </h1>
              <p className="text-primary-100 mb-6 text-lg">
                Level {user.level} • {user.xp} XP • Daily streak: {user.streak} days
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  className="bg-white text-primary hover:bg-primary-50 font-semibold"
                  onClick={() => window.location.href = '/challenges'}
                >
                  <i className="fas fa-plus mr-2"></i>Create Challenge
                </Button>
                <Button
                  variant="secondary"
                  className="bg-primary-700 text-white hover:bg-primary-800 font-semibold"
                  onClick={() => window.location.href = '/events'}
                >
                  <i className="fas fa-search mr-2"></i>Browse Events
                </Button>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary opacity-20 rounded-full -ml-24 -mb-24"></div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Wins</p>
                  <p className="text-2xl font-bold text-emerald-600">{userStats?.wins || 0}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                  <i className="fas fa-trophy text-emerald-600 dark:text-emerald-400"></i>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-emerald-600">+12% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Active Challenges</p>
                  <p className="text-2xl font-bold text-primary">{userStats?.activeChallenges || 0}</p>
                </div>
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-swords text-primary"></i>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-slate-600 dark:text-slate-400">3 ending today</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Points Balance</p>
                  <p className="text-2xl font-bold text-amber-600">{user.points || 0}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
                  <i className="fas fa-coins text-amber-600 dark:text-amber-400"></i>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-amber-600">Earn 50 daily bonus</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Friends Online</p>
                  <p className="text-2xl font-bold text-cyan-600">{userStats?.friendsOnline || 0}</p>
                </div>
                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-lg flex items-center justify-center">
                  <i className="fas fa-users text-cyan-600 dark:text-cyan-400"></i>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-cyan-600">of {(userStats?.friendsOnline || 0) * 3} total friends</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Active Events */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Events */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Hot Events 🔥</CardTitle>
                  <Button variant="ghost" className="text-primary" onClick={() => window.location.href = '/events'}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {eventsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Loading events...</p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-calendar-times text-4xl text-slate-400 mb-4"></i>
                    <p className="text-slate-600 dark:text-slate-400">No active events found</p>
                  </div>
                ) : (
                  events.slice(0, 3).map((event: any) => (
                    <EventCard key={event.id} event={event} />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Recent Challenges */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Recent Challenges ⚔️</CardTitle>
                  <Button variant="ghost" className="text-primary" onClick={() => window.location.href = '/challenges'}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {challengesLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Loading challenges...</p>
                  </div>
                ) : challenges.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-swords text-4xl text-slate-400 mb-4"></i>
                    <p className="text-slate-600 dark:text-slate-400">No challenges found</p>
                  </div>
                ) : (
                  challenges.slice(0, 3).map((challenge: any) => (
                    <ChallengeCard key={challenge.id} challenge={challenge} />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <LiveChat />
            <AchievementsList />
            
            {/* Quick Actions */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start bg-primary/10 text-primary hover:bg-primary/20"
                  onClick={() => window.location.href = '/events'}
                >
                  <i className="fas fa-plus-circle mr-3"></i>
                  Create Event
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start bg-secondary/10 text-secondary hover:bg-secondary/20"
                  onClick={() => window.location.href = '/challenges'}
                >
                  <i className="fas fa-swords mr-3"></i>
                  Challenge Friend
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                  onClick={() => window.location.href = '/wallet'}
                >
                  <i className="fas fa-wallet mr-3"></i>
                  Add Funds
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/30"
                  onClick={() => window.location.href = '/referrals'}
                >
                  <i className="fas fa-share-alt mr-3"></i>
                  Invite Friends
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <MobileNavigation />
      <NotificationToast />
    </div>
  );
}
