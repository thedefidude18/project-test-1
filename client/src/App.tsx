import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useEffect, useState } from "react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Events from "./pages/Events";
import EventCreate from "./pages/EventCreate";
import Challenges from "./pages/Challenges";
import Friends from "./pages/Friends";
import Profile from "./pages/Profile";
import ProfileSettings from "./pages/ProfileSettings";
import History from "./pages/History";
import Notifications from "./pages/Notifications";
import WalletPage from "./pages/WalletPage";
import ReferralPage from "./pages/ReferralPage";
import Settings from "./pages/Settings";
import Leaderboard from "./pages/Leaderboard";
import ChallengeDetail from "./pages/ChallengeDetail";
import EventChatPage from "./pages/EventChatPage";
import AdminDashboardOverview from "./pages/AdminDashboardOverview";
import AdminEventPayouts from "./pages/AdminEventPayouts";
import AdminChallengePayouts from "./pages/AdminChallengePayouts";
import AdminPayouts from "./pages/AdminPayouts";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminNotifications from "@/pages/AdminNotifications";
import AdminUsersManagement from "./pages/AdminUsersManagement";
import AdminSettings from "./pages/AdminSettings";
import { DailySignInModal } from '@/components/DailySignInModal';
import { useDailySignIn } from '@/hooks/useDailySignIn';
import AdminLogin from "@/pages/AdminLogin"; // Assuming you have an AdminLogin component
import { WebsiteTour, useTour } from "@/components/WebsiteTour";
import { SplashScreen } from "@/components/SplashScreen"; //Import Splashscreen
import MobileSplashScreen from "@/components/MobileSplashScreen";
import TelegramTest from "@/pages/TelegramTest";


function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showMobileSplash, setShowMobileSplash] = useState(true);

  // Initialize tour
  const tour = useTour();

  // Add global tour event listener
  useEffect(() => {
    const handleStartTour = () => {
      tour.startTour();
    };

    window.addEventListener('start-tour', handleStartTour);

    return () => {
      window.removeEventListener('start-tour', handleStartTour);
    };
  }, [tour]);

  // Initialize notifications for authenticated users
  const notifications = useNotifications();

  // Initialize daily sign-in for authenticated users
  const dailySignIn = useDailySignIn();
  const { signInStatus, showModal, setShowModal } = dailySignIn;

  // Show mobile splash screen only on mobile devices
  const isMobile = window.innerWidth < 768;

  return (
    <div className="min-h-screen transition-all duration-300 ease-in-out">
      {/* Mobile Splash Screen */}
      {isMobile && showMobileSplash && (
        <MobileSplashScreen onComplete={() => setShowMobileSplash(false)} />
      )}

      <Switch>
      {/* Admin Login Route - Always Available */}
      <Route path="/admin/login" component={AdminLogin} />
      {/* Public Routes - Accessible to everyone */}
      <Route path="/events/:id/chat" component={EventChatPage} />
      <Route path="/event/:id" component={EventChatPage} />
      
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/ref/:code" component={Landing} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/events" component={Events} />
          <Route path="/events/create" component={EventCreate} />
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
          <Route path="/admin" component={AdminDashboardOverview} />
          <Route path="/admin/payouts" component={AdminPayouts} />
          <Route path="/admin/events" component={AdminEventPayouts} />
          <Route path="/admin/challenges" component={AdminChallengePayouts} />
          <Route path="/admin/analytics" component={AdminAnalytics} />
          <Route path="/admin/notifications" component={AdminNotifications} />
          <Route path="/admin/users" component={AdminUsersManagement} />
          <Route path="/admin/settings" component={AdminSettings} />
          <Route path="/telegram/test" component={TelegramTest} />
          <Route path="/ref/:code" component={Landing} />
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

    {/* Website Tour */}
    {isAuthenticated && (
      <WebsiteTour 
        isOpen={tour.isOpen}
        onClose={tour.closeTour}
      />
    )}
    </div>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <div className={`${isMobile ? 'mobile-app' : ''}`}>
          {showSplash && isMobile ? (
            <SplashScreen onComplete={handleSplashComplete} />
          ) : (
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
          )}
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;