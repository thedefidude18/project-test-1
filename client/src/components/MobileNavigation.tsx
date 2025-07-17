import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { useQuery } from "@tanstack/react-query";
import { formatBalance } from "@/utils/currencyUtils";
import { ShoppingCart } from "lucide-react";

export function MobileNavigation() {
  const { user } = useAuth();
  const { navigateTo } = useAppNavigation();
  const { unreadCount } = useNotifications();

  const { data: balance = 0 } = useQuery({
    queryKey: ["/api/wallet/balance"],
    retry: false,
    enabled: !!user,
  });

  const [location, navigate] = useLocation();

  // Generate user avatar for profile nav item with default Dicebear avatar
  const userAvatar = user ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email || user.claims?.email || 'default')}&backgroundColor=7440ff&scale=85` : null;

  const navItems = [
    { 
      path: "/events", 
      iconPath: "/assets/eventssvg.svg",
      label: "Events",
      isActive: location.startsWith("/events") || location === "/",
      tourId: "events"
    },
    { 
      path: "/challenges", 
      iconPath: "/assets/versus.svg",
      label: "Challenges",
      isActive: location.startsWith("/challenges"),
      tourId: "challenges"
    },
    { 
      path: "/events/create", 
      iconPath: "/assets/createvent.svg",
      label: "Create",
      isActive: location.startsWith("/events/create"),
      tourId: "create"
    },
    { 
      path: "/history", 
      iconPath: "/assets/listsvg.svg",
      label: "History",
      isActive: location.startsWith("/history"),
      tourId: "history"
    },
    { 
      path: "/profile", 
      iconPath: "/assets/user.svg",
      label: "Profile",
      isActive: location === "/profile",
      tourId: "profile",
      isProfileIcon: true
    },
  ];

  const handleNavigation = (path: string) => {
    // Redirect home to events on mobile
    if (path === "/" || path === "/events") {
      navigate("/events");
    } else {
      navigate(path);
    }
  };

  return (
    <>
      {/* Mobile Wallet Display */}
      

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 md:hidden z-50 shadow-lg">
        <div className="flex items-center justify-around px-1 py-2">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            className={cn(
              "flex flex-col items-center justify-center p-1.5 rounded-lg transition-all duration-200 ease-in-out min-w-[50px]",
              "hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95",
              item.isActive 
                ? "text-primary bg-primary/10 scale-105" 
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
            data-tour={item.tourId}
          >
            {item.isProfileIcon && userAvatar ? (
              <img 
                src={userAvatar}
                alt={item.label}
                className={cn(
                  "w-5 h-5 mb-1 transition-transform duration-200 rounded-full",
                  item.isActive && "scale-110",
                  item.isActive ? "opacity-100 ring-2 ring-primary" : "opacity-70"
                )}
              />
            ) : (
              <img 
                src={item.iconPath}
                alt={item.label}
                className={cn(
                  "w-5 h-5 mb-1 transition-transform duration-200",
                  item.isActive && "scale-110",
                  item.isActive ? "opacity-100" : "opacity-70"
                )}
              />
            )}
            <span className={cn(
              "text-[10px] font-medium transition-all duration-200 leading-none",
              item.isActive && "font-semibold"
            )}>
              {item.label}
            </span>
            {item.isActive && (
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
        </div>
      </div>
    </>
  );
}