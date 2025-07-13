import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/AdminLayout";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { 
  Trophy, 
  Target, 
  DollarSign, 
  Users, 
  AlertCircle,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowRight,
  Activity
} from "lucide-react";

interface Event {
  id: number;
  title: string;
  description?: string;
  category: string;
  status: string;
  creatorId: string;
  eventPool: string;
  yesPool: string;
  noPool: string;
  entryFee: string;
  endDate: string;
  result?: boolean;
  adminResult?: boolean;
  creatorFee: string;
  isPrivate: boolean;
  maxParticipants: number;
  createdAt: string;
}

interface Challenge {
  id: number;
  title: string;
  status: string;
  amount: string;
  result: string | null;
  dueDate: string;
  challengerUser: { username: string };
  challengedUser: { username: string };
}

export default function AdminDashboardOverview() {
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/events"],
    retry: false,
  });

  const { data: challenges = [], isLoading: challengesLoading } = useQuery({
    queryKey: ["/api/admin/challenges"],
    retry: false,
  });

  // Get admin statistics
  const { data: adminStats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    retry: false,
  });

  // Get recent users
  const { data: recentUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  // Get platform activity
  const { data: platformActivity = [], isLoading: activityLoading } = useQuery({
    queryKey: ["/api/admin/activity"],
    retry: false,
  });

  const needsEventAction = (event: Event) => {
    const endDate = new Date(event.endDate);
    const now = new Date();
    return endDate <= now && event.status === 'active' && event.adminResult === null;
  };

  const needsChallengeAction = (challenge: Challenge) => {
    return challenge.status === 'active' && challenge.dueDate && 
           new Date(challenge.dueDate) <= new Date() && !challenge.result;
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getChallengeStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'disputed': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Calculate stats
  const eventsNeedingAction = events.filter((e: Event) => needsEventAction(e));
  const challengesNeedingAction = challenges.filter((c: Challenge) => needsChallengeAction(c));
  const activeEvents = events.filter((e: Event) => e.status === 'active');
  const completedEvents = events.filter((e: Event) => e.status === 'completed');
  const activeChallenges = challenges.filter((c: Challenge) => c.status === 'active');
  const completedChallenges = challenges.filter((c: Challenge) => c.status === 'completed');

  const totalEventPool = events.reduce((sum: number, e: Event) => sum + parseFloat(e.eventPool || '0'), 0);
  const totalChallengeStaked = challenges.reduce((sum: number, c: Challenge) => sum + (parseFloat(c.amount) * 2), 0);
  const totalCreatorFees = events.reduce((sum: number, e: Event) => sum + parseFloat(e.creatorFee || '0'), 0);
  const totalPlatformFees = completedChallenges.reduce((sum: number, c: Challenge) => sum + (parseFloat(c.amount) * 2 * 0.05), 0);

  const isLoading = eventsLoading || challengesLoading;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400">Overview of platform activities and required actions</p>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-green-400" />
            <span className="text-sm text-slate-400">Live</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Actions Needed</p>
                  <p className="text-2xl font-bold text-red-400">
                    {eventsNeedingAction.length + challengesNeedingAction.length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Value Locked</p>
                  <p className="text-2xl font-bold text-green-400">
                    ₦{(totalEventPool + totalChallengeStaked).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Events</p>
                  <p className="text-2xl font-bold text-blue-400">{activeEvents.length}</p>
                </div>
                <Trophy className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Challenges</p>
                  <p className="text-2xl font-bold text-purple-400">{activeChallenges.length}</p>
                </div>
                <Target className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Creator Fees Collected</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    ₦{totalCreatorFees.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Platform Fees</p>
                  <p className="text-2xl font-bold text-indigo-400">
                    ₦{totalPlatformFees.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-indigo-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Completed</p>
                  <p className="text-2xl font-bold text-green-400">
                    {completedEvents.length + completedChallenges.length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Events Section */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-blue-400" />
                  Event Management
                </div>
                <Link href="/admin/events">
                  <Button size="sm" variant="outline" className="border-slate-600">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventsNeedingAction.length > 0 && (
                  <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-400 font-medium">Events Needing Action</p>
                        <p className="text-sm text-slate-400">
                          {eventsNeedingAction.length} events require admin resolution
                        </p>
                      </div>
                      <Badge variant="destructive">{eventsNeedingAction.length}</Badge>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800 p-3 rounded-lg">
                    <p className="text-slate-400 text-sm">Active Events</p>
                    <p className="text-xl font-bold text-white">{activeEvents.length}</p>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-lg">
                    <p className="text-slate-400 text-sm">Total Pool</p>
                    <p className="text-xl font-bold text-white">₦{totalEventPool.toLocaleString()}</p>
                  </div>
                </div>

                {eventsNeedingAction.slice(0, 3).map((event: Event) => (
                  <div key={event.id} className="bg-slate-800 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium text-sm">{event.title}</p>
                        <p className="text-slate-400 text-xs">
                          Ended {formatDistanceToNow(new Date(event.endDate), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge className={getEventStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Challenges Section */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-purple-400" />
                  Challenge Management
                </div>
                <Link href="/admin/challenges">
                  <Button size="sm" variant="outline" className="border-slate-600">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {challengesNeedingAction.length > 0 && (
                  <div className="bg-orange-900/20 border border-orange-800 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-400 font-medium">Challenges Needing Action</p>
                        <p className="text-sm text-slate-400">
                          {challengesNeedingAction.length} challenges require admin resolution
                        </p>
                      </div>
                      <Badge variant="destructive">{challengesNeedingAction.length}</Badge>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800 p-3 rounded-lg">
                    <p className="text-slate-400 text-sm">Active Challenges</p>
                    <p className="text-xl font-bold text-white">{activeChallenges.length}</p>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-lg">
                    <p className="text-slate-400 text-sm">Total Staked</p>
                    <p className="text-xl font-bold text-white">₦{totalChallengeStaked.toLocaleString()}</p>
                  </div>
                </div>

                {challengesNeedingAction.slice(0, 3).map((challenge: Challenge) => (
                  <div key={challenge.id} className="bg-slate-800 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium text-sm">{challenge.title}</p>
                        <p className="text-slate-400 text-xs">
                          {challenge.challengerUser.username} vs {challenge.challengedUser.username}
                        </p>
                      </div>
                      <Badge className={getChallengeStatusColor(challenge.status)}>
                        {challenge.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...completedEvents.slice(0, 3), ...completedChallenges.slice(0, 3)]
                .sort((a, b) => new Date(b.createdAt || b.completedAt || '').getTime() - new Date(a.createdAt || a.completedAt || '').getTime())
                .slice(0, 5)
                .map((item: any) => (
                  <div key={`${item.id}-${item.challenger ? 'challenge' : 'event'}`} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {item.challenger ? (
                        <Target className="w-5 h-5 text-purple-400" />
                      ) : (
                        <Trophy className="w-5 h-5 text-blue-400" />
                      )}
                      <div>
                        <p className="text-white font-medium">{item.title}</p>
                        <p className="text-slate-400 text-sm">
                          {item.challenger ? 'Challenge' : 'Event'} completed
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={item.challenger ? getChallengeStatusColor(item.status) : getEventStatusColor(item.status)}>
                        Completed
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}