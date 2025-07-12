import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
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
import AdminDashboard from "@/pages/AdminDashboard";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

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
          <Route path="/friends" component={Friends} />
          <Route path="/wallet" component={WalletPage} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/profile" component={Profile} />
          <Route path="/profile/settings" component={ProfileSettings} />
          <Route path="/referrals" component={ReferralPage} />
          <Route path="/history" component={History} />
          <Route path="/settings" component={Settings} />
          <Route path="/admin" component={AdminDashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
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
