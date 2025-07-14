import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Events from "@/pages/Events";
import Challenges from "@/pages/Challenges";
import Friends from "@/pages/Friends";
import WalletPage from "@/pages/WalletPage";
import Leaderboard from "@/pages/Leaderboard";
import Notifications from "@/pages/Notifications";
import Profile from "@/pages/Profile";
import ProfileSettings from "@/pages/ProfileSettings";
import ReferralPage from "@/pages/ReferralPage";
import EventChatPage from "@/pages/EventChatPage";
import History from "@/pages/History";
import Settings from "@/pages/Settings";
import AdminDashboardOverview from "./pages/AdminDashboardOverview";
import AdminEventPayouts from "./pages/AdminEventPayouts";
import AdminChallengePayouts from "./pages/AdminChallengePayouts";
import AdminPayouts from "./pages/AdminPayouts";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminNotifications from "./pages/AdminNotifications";
import AdminSettings from "./pages/AdminSettings";
import ChallengeDetail from "./pages/ChallengeDetail";
import { DailySignInModal } from '@/components/DailySignInModal';
import { useDailySignIn } from '@/hooks/useDailySignIn';
import AdminLogin from "@/pages/AdminLogin"; // Assuming you have an AdminLogin component

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Initialize notifications for authenticated users
  const notifications = useNotifications();

  // Initialize daily sign-in for authenticated users
  const dailySignIn = useDailySignIn();
  const { signInStatus, showModal, setShowModal } = dailySignIn;

  return (
    <div className="min-h-screen transition-all duration-300 ease-in-out">
      <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/events" component={Events} />
          <Route path="/events/:id/chat" component={EventChatPage} />
          <Route path="/challenges" component={Challenges} />
          <Route path="/challenges/:id" component={ChallengeDetail} />
          <Route path="/friends" component={Friends} />
          <Route path="/wallet" component={WalletPage} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/profile" component={Profile} />
          <Route path="/profile/settings" component={ProfileSettings} />
          <Route path="/referrals" component={ReferralPage} />
          <Route path="/history" component={History} />
          <Route path="/settings" component={Settings} />
          {/* Admin Login Route - Always Available */}
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin" component={AdminDashboardOverview} />
          <Route path="/admin/payouts" component={AdminPayouts} />
          <Route path="/admin/events" component={AdminEventPayouts} />
          <Route path="/admin/challenges" component={AdminChallengePayouts} />
          <Route path="/admin/analytics" component={AdminAnalytics} />
          <Route path="/admin/notifications" component={AdminNotifications} />
          <Route path="/admin/settings" component={AdminSettings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>

    {/* Daily Sign-In Modal */}
    {isAuthenticated && signInStatus && (
      <DailySignInModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        pointsToAward={signInStatus.pointsToAward}
        currentStreak={signInStatus.currentStreak}
      />
    )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;