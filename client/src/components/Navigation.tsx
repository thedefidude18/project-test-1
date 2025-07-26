import { useAuth } from "@/hooks/useAuth";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useNotifications } from "@/hooks/useNotifications";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatBalance } from "@/utils/currencyUtils";
import { getAvatarUrl } from "@/utils/avatarUtils";
import { UserAvatar } from "@/components/UserAvatar";
import { useEventsSearch } from "../context/EventsSearchContext"; // Corrected import

  // Only show search bar on /events route and desktop
  const showEventsSearch = location === "/events";
import {
  Bell,
  Settings,
  Users,
  Calendar,
  Trophy,
  Wallet,
  Home,
  Menu,
  X,
  Sun,
  Moon,
  ShoppingCart,
  ArrowLeft,
  User,
  Clock,
  LogOut,
} from "lucide-react";
import { Link } from "wouter"; // Import Link from wouter

export function Navigation() {
  const { searchTerm, setSearchTerm } = useEventsSearch();
  const { user } = useAuth();

  const { notifications, unreadCount } = useNotifications();

  const { data: balance = 0 } = useQuery({
    queryKey: ["/api/wallet/balance"],
    retry: false,
    enabled: !!user,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  const [location, navigate] = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const [showSignIn, setShowSignIn] = useState(false);

  if (!user) {
    return (
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 theme-transition sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 hover:opacity-80 transition-opacity" onClick={() => window.location.href = '/'}>
                <img src="/assets/bantahblue.svg" alt="BetChat Logo" className="w-8 h-8" />
                <span className="text-xl font-bold text-slate-900 dark:text-white">Bantah</span>
              </button>
            </div>
            {/* Sign In Button */}
            <div>
              <button
                onClick={() => setShowSignIn(true)}
                className="bg-primary text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-primary/90 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
        {/* Sign In Modal */}
        <Dialog open={showSignIn} onOpenChange={setShowSignIn}>
          <DialogContent className="sm:max-w-sm rounded-3xl border-0 shadow-2xl overflow-hidden">
            <DialogHeader className="pb-2">
              <div className="flex flex-col items-center justify-center w-full">
                <img
                  src="/assets/bantahblue.svg"
                  alt="Bantah Logo"
                  className="w-16 h-16 mb-2 drop-shadow-lg"
                  style={{ objectFit: 'contain' }}
                />
                <DialogTitle className="text-center text-lg font-bold text-gray-800 dark:text-gray-200">
                  Sign in to Bantah
                </DialogTitle>
              </div>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4 py-2">
              <button
                onClick={() => { window.location.href = '/api/login'; }}
                className="w-full bg-primary text-white py-2 rounded-lg font-semibold shadow hover:bg-primary/90 transition-colors"
              >
                Continue with Telegram
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">By signing in, you agree to our Terms and Privacy Policy.</p>
            </div>
          </DialogContent>
        </Dialog>
      </nav>
    );
  }

    // Check if current page should show logo (events and home pages)
    const shouldShowLogo = location === "/" || location === "/events" || location === "/home";

    // Get page title for non-logo pages
    const getPageTitle = () => {
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
      if (location.startsWith("/referrals")) return "Referrals";
      return "BetChat";
    };
  
    const handleBack = () => {
      // Navigate back to events page (main page for mobile)
      navigate("/events");
    };

  return (
    <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 theme-transition sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <button onClick={() => handleNavigation("/")} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <img src="/assets/bantahblue.svg" alt="BetChat Logo" className="w-8 h-8" />
              <span className="text-2xl font-black text-slate-900 dark:text-white">Bantah</span>
            </button>
          </div>
          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => handleNavigation("/events")}
              className="text-slate-600 dark:text-slate-300 text-base font-semibold hover:text-primary dark:hover:text-primary transition-colors flex items-center gap-1.5"
              data-tour="events"
            >
              <Calendar className="w-4 h-4" />
              Events
            </button>
            <button
              onClick={() => handleNavigation("/challenges")}
              className="text-slate-600 dark:text-slate-300 text-base font-semibold hover:text-primary dark:hover:text-primary transition-colors flex items-center gap-1.5"
              data-tour="challenges"
            >
              <Trophy className="w-4 h-4" />
              Challenges
            </button>
            <button
              onClick={() => handleNavigation("/friends")}
              className="text-slate-600 dark:text-slate-300 text-base font-semibold hover:text-primary dark:hover:text-primary transition-colors flex items-center gap-1.5"
              data-tour="friends"
            >
              <Users className="w-4 h-4" />
              Friends
            </button>

            <button
              onClick={() => handleNavigation("/leaderboard")}
              className="text-slate-600 dark:text-slate-300 text-base font-semibold hover:text-primary dark:hover:text-primary transition-colors flex items-center gap-1.5"
              data-tour="leaderboard"
            >
              <Trophy className="w-4 h-4" />
              Leaderboard
            </button>
          </div>

          {/* Right Side Items */}
          <div className="flex items-center space-x-4">
            {/* Wallet Balance & Coins */}
            <button
              onClick={() => handleNavigation("/wallet")}
              className="flex items-center gap-4 px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: "#7440ff", color: "white" }}
              data-tour="wallet"
            >
              <div className="flex items-center gap-2">
                <i className="fas fa-wallet text-emerald-500"></i>
                <span className="text-sm font-medium">
                  {formatBalance(
                    typeof balance === "object"
                      ? balance.balance || 0
                      : balance || 0,
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-coins text-yellow-400"></i>
                <span className="text-sm font-medium">
                  {typeof balance === "object"
                    ? (balance.coins || 0).toLocaleString()
                    : "0"}
                </span>
              </div>
            </button>

            {/* Notifications */}
            <button
              onClick={() => handleNavigation("/notifications")}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
              data-tour="notifications"
            >
              <img
                src="/assets/notify22.svg"
                alt="Calendar"
                className="w-7 h-7"
              />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </button>

            {/* Profile Button - Desktop Only */}
            <button
              onClick={() => handleNavigation("/profile")}
              className="relative flex items-center justify-center w-8 h-8 rounded-full overflow-hidden hover:ring-2 hover:ring-primary transition-all"
            >
              <UserAvatar
                user={user}
                className="w-full h-full"
              />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}