import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { MobileNavigation } from "@/components/MobileNavigation";
import { NotificationToast } from "@/components/NotificationToast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNotifications } from "@/hooks/useNotifications";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { notifications, unreadCount } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter featured content based on search
  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChallenges = challenges.filter(challenge => 
    challenge.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    challenge.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition">
      <Navigation />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background with gradient and decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#7440FF] via-[#7440FF]/90 to-[#9D6BFF]">
          {/* Floating islands/decorative elements */}
          <div className="absolute top-10 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute top-32 right-40 w-20 h-20 bg-secondary/20 rounded-full blur-lg"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-40 left-10 w-16 h-16 bg-secondary/20 rounded-full blur-lg"></div>

          {/* Geometric shapes */}
          <div className="absolute top-20 left-1/4 w-8 h-8 bg-white/20 rotate-45 rounded-sm"></div>
          <div className="absolute bottom-1/3 right-1/4 w-6 h-6 bg-secondary/30 rotate-12 rounded-sm"></div>
          <div className="absolute top-1/2 left-20 w-4 h-4 bg-white/25 rotate-45 rounded-full"></div>
        </div>

        {/* Main hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Find your betting community on BetChat
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              From crypto predictions to sports betting, there's a place for you.
            </p>

            {/* Search bar */}
            <div className="relative max-w-md mx-auto mb-8">
              <Input
                type="text"
                placeholder="Explore communities and events"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border-0 rounded-full px-6 py-4 text-lg shadow-lg"
              />
              <Button
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-slate-600 hover:bg-slate-700"
              >
                <i className="fas fa-search"></i>
              </Button>
            </div>

            {/* Quick stats */}
            <div className="flex justify-center space-x-8 text-white/90 text-sm">
              <div>
                <span className="font-bold text-lg">Level {user.level}</span>
                <p>Your Level</p>
              </div>
              <div>
                <span className="font-bold text-lg">{user.xp}</span>
                <p>Total XP</p>
              </div>
              <div>
                <span className="font-bold text-lg">{user.streak}</span>
                <p>Day Streak</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
          Featured Communities
        </h2>

        {/* Featured Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {(searchQuery ? filteredEvents : events.slice(0, 6)).map((event, index) => (
            <Card key={event.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-t-lg relative overflow-hidden">
                {/* Event type badge */}
                <div className="absolute top-3 left-3">
                  <span className="bg-primary text-white px-2 py-1 rounded-full text-xs font-medium">
                    {event.category || 'Prediction'}
                  </span>
                </div>
                {/* Participant count */}
                <div className="absolute bottom-3 right-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                  <i className="fas fa-users mr-1"></i>
                  {event.participantCount || Math.floor(Math.random() * 1000) + 100}
                </div>
                {/* Decorative icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="fas fa-calendar text-4xl text-primary/30"></i>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
                  {event.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-3 line-clamp-2">
                  {event.description}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    <i className="fas fa-clock mr-1"></i>
                    {new Date(event.endDate).toLocaleDateString()}
                  </span>
                  <span className="text-emerald-600 font-medium">
                    ₦{event.poolSize || Math.floor(Math.random() * 100000) + 1000}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="text-center">
          <div className="inline-flex space-x-4">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90"
              onClick={() => window.location.href = '/events'}
            >
              <i className="fas fa-plus mr-2"></i>
              Create Event
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.location.href = '/challenges'}
            >
              <i className="fas fa-swords mr-2"></i>
              Challenge Friends
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.location.href = '/wallet'}
            >
              <i className="fas fa-wallet mr-2"></i>
              Add Funds
            </Button>
          </div>
        </div>

        {/* Recent Activity (simplified) */}
        {(filteredChallenges.length > 0 || challenges.length > 0) && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
              Recent Challenges
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(searchQuery ? filteredChallenges : challenges.slice(0, 4)).map((challenge) => (
                <Card key={challenge.id} className="hover:shadow-md transition-shadow bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{challenge.title || 'Challenge'}</h3>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        ₦{challenge.amount || 0}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                      {challenge.description || 'Peer-to-peer challenge'}
                    </p>
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Active
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <MobileNavigation />
      <NotificationToast />
    </div>
  );
}