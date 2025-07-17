import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface MobileHeaderProps {
  title?: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
}

export function MobileHeader({ title, onBack, rightContent }: MobileHeaderProps) {
  const [location, navigate] = useLocation();
  
  // Show logo only on home page
  const isHomePage = location === "/" || location === "/events" || location === "/home";
  
  // Don't show header on home page as it has its own hero section
  if (isHomePage) {
    return null;
  }

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/events"); // Default back to events page
    }
  };

  const getPageTitle = () => {
    if (title) return title;
    
    // Auto-generate title based on route
    if (location.startsWith("/events/create")) return "Create Event";
    if (location.startsWith("/events/")) return "Event Chat";
    if (location.startsWith("/challenges")) return "Challenges";
    if (location.startsWith("/wallet")) return "Wallet";
    if (location.startsWith("/profile")) return "Profile";
    if (location.startsWith("/friends")) return "Friends";
    if (location.startsWith("/leaderboard")) return "Leaderboard";
    if (location.startsWith("/notifications")) return "Notifications";
    if (location.startsWith("/settings")) return "Settings";
    if (location.startsWith("/shop")) return "Coin Shop";
    if (location.startsWith("/history")) return "History";
    if (location.startsWith("/admin")) return "Admin";
    
    return "BetChat";
  };

  return (
    <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 md:hidden rounded-b-2xl">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </Button>

        {/* Page Title */}
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate px-4">
          {getPageTitle()}
        </h1>

        {/* Right Content or Spacer */}
        {rightContent || (
          <div className="w-9 h-9"> {/* Spacer to center title */}
          </div>
        )}
      </div>
    </div>
  );
}