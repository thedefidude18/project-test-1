import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useNotifications } from "@/hooks/useNotifications";
import { ThemeToggle } from "@/components/ThemeToggle";
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

export function Navigation() {
  const { user } = useAuth();

  const { notifications, unreadCount } = useNotifications();

  const { data: balance = 0 } = useQuery({
    queryKey: ["/api/wallet/balance"],
    retry: false,
    enabled: !!user,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  const [, navigate] = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  if (!user) return null;

  return (
    <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 theme-transition sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleNavigation('/')}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <i className="fas fa-dice text-white text-sm"></i>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                BetChat
              </span>
            </button>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => handleNavigation('/')}
              className="text-primary font-medium hover:text-primary/80 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => handleNavigation('/events')}
              className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
              data-tour="events"
            >
              Events
            </button>
            <button
              onClick={() => handleNavigation('/challenges')}
              className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
              data-tour="challenges"
            >
              Challenges
            </button>
            <button
              onClick={() => handleNavigation('/friends')}
              className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
              data-tour="friends"
            >
              Friends
            </button>
            <button
              onClick={() => handleNavigation('/leaderboard')}
              className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
            >
              Leaderboard
            </button>
            <button
              onClick={() => handleNavigation('/admin')}
              className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
            >
              Admin
            </button>
          </div>

          {/* Right Side Items */}
          <div className="flex items-center space-x-4">
            {/* Wallet Balance */}
            <button
              onClick={() => handleNavigation('/wallet')}
              className="hidden sm:flex items-center space-x-2 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              data-tour="wallet"
            >
              <i className="fas fa-wallet text-emerald-500"></i>
              <span className="text-sm font-medium">{formatBalance(typeof balance === 'object' ? (balance.balance || 0) : (balance || 0))}</span>
            </button>

            {/* Notifications */}
            <button
              onClick={() => handleNavigation('/notifications')}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
              data-tour="notifications"
            >
              <i className="fas fa-bell"></i>
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Tour Button */}
            <button
              onClick={() => {
                // Add tour functionality
                const event = new CustomEvent('start-tour');
                window.dispatchEvent(event);
              }}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Start Website Tour"
            >
              <i className="fas fa-question-circle"></i>
            </button>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-2" data-tour="profile">
                  <UserAvatar
                    userId={user.id}
                    username={user.username}
                    size={32}
                    className="h-8 w-8"
                  />
                  <span className="hidden sm:block text-sm font-medium">
                    {user.firstName || user.username}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
                  <i className="fas fa-user mr-2"></i>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation('/profile/settings')}>
                  <i className="fas fa-cog mr-2"></i>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation('/wallet')}>
                  <i className="fas fa-wallet mr-2"></i>
                  Wallet
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation('/history')}>
                  <i className="fas fa-history mr-2"></i>
                  History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation('/referrals')}>
                  <i className="fas fa-share-alt mr-2"></i>
                  Referrals
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => window.location.href = '/api/logout'}
                  className="text-red-600 dark:text-red-400"
                >
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}