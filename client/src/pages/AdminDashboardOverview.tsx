import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Target,
  Trophy,
  DollarSign,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Event {
  id: number;
  title: string;
  status: string;
  eventPool: string;
  endDate: string;
  adminResult: boolean | null;
  creatorFee: string;
  createdAt: string;
}

interface Challenge {
  id: number;
  title: string;
  status: string;
  amount: string;
  result: string | null;
  dueDate: string;
  createdAt: string;
  challengerUser: { username: string; firstName?: string };
  challengedUser: { username: string; firstName?: string };
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

  const { data: adminStats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    retry: false,
  });

  const { data: recentUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

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
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getChallengeStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'disputed': return 'bg-red-500';
      default: return 'bg-gray-500';
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
                  <p className="text-slate-400 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-blue-400">{adminStats.totalUsers || 0}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
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
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Platform Fees</p>
                  <p className="text-2xl font-bold text-purple-400">
                    ₦{(totalCreatorFees + totalPlatformFees).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Events Overview */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Events Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-slate-800 rounded-lg">
                  <p className="text-2xl font-bold text-green-400">{activeEvents.length}</p>
                  <p className="text-sm text-slate-400">Active</p>
                </div>
                <div className="text-center p-3 bg-slate-800 rounded-lg">
                  <p className="text-2xl font-bold text-blue-400">{completedEvents.length}</p>
                  <p className="text-sm text-slate-400">Completed</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Events Needing Action</span>
                  <span className="text-red-400 font-semibold">{eventsNeedingAction.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Pool Value</span>
                  <span className="text-white font-semibold">₦{totalEventPool.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Challenges Overview */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Challenges Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-slate-800 rounded-lg">
                  <p className="text-2xl font-bold text-green-400">{activeChallenges.length}</p>
                  <p className="text-sm text-slate-400">Active</p>
                </div>
                <div className="text-center p-3 bg-slate-800 rounded-lg">
                  <p className="text-2xl font-bold text-blue-400">{completedChallenges.length}</p>
                  <p className="text-sm text-slate-400">Completed</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Challenges Needing Action</span>
                  <span className="text-red-400 font-semibold">{challengesNeedingAction.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Stakes</span>
                  <span className="text-white font-semibold">₦{totalChallengeStaked.toLocaleString()}</span>
                </div>
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
              {[...events.slice(0, 3), ...challenges.slice(0, 3)]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 10)
                .map((item: any, index) => (
                  <div key={`${item.id}-${index}`} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${item.challengerUser ? getChallengeStatusColor(item.status) : getEventStatusColor(item.status)}`}></div>
                      <div>
                        <p className="text-white font-medium">{item.title}</p>
                        <p className="text-slate-400 text-sm">
                          {item.challengerUser ? 'Challenge' : 'Event'} • {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={item.challengerUser ? getChallengeStatusColor(item.status) : getEventStatusColor(item.status)}>
                        {item.status}
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