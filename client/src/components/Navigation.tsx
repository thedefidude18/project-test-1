import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
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

export function Navigation() {
  const { user } = useAuth();
  
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

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
            >
              Events
            </button>
            <button
              onClick={() => handleNavigation('/challenges')}
              className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
            >
              Challenges
            </button>
            <button
              onClick={() => handleNavigation('/friends')}
              className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
            >
              Friends
            </button>
            <button
              onClick={() => handleNavigation('/leaderboard')}
              className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
            >
              Leaderboard
            </button>
          </div>

          {/* Right Side Items */}
          <div className="flex items-center space-x-4">
            {/* Wallet Balance */}
            <button
              onClick={() => handleNavigation('/wallet')}
              className="hidden sm:flex items-center space-x-2 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <i className="fas fa-wallet text-emerald-500"></i>
              <span className="text-sm font-medium">₦{user.balance || '0'}</span>
            </button>

            {/* Notifications */}
            <button
              onClick={() => handleNavigation('/notifications')}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
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

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage 
                      src={user.profileImageUrl || undefined} 
                      alt={user.firstName || user.username || 'User'} 
                    />
                    <AvatarFallback>
                      {(user.firstName?.[0] || user.username?.[0] || 'U').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
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
