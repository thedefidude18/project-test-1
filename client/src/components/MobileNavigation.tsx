import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { useQuery } from "@tanstack/react-query";
import { formatBalance } from "@/utils/currencyUtils";

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

  const navItems = [
    { 
      path: "/events", 
      icon: "fas fa-calendar", 
      label: "Events",
      isActive: location.startsWith("/events") || location === "/",
      tourId: "events"
    },
    { 
      path: "/challenges", 
      icon: "fas fa-swords", 
      label: "Challenges",
      isActive: location.startsWith("/challenges"),
      tourId: "challenges"
    },
    { 
      path: "/friends", 
      icon: "fas fa-users", 
      label: "Friends",
      isActive: location.startsWith("/friends"),
      tourId: "friends"
    },
    { 
      path: "/profile", 
      icon: "fas fa-user", 
      label: "Profile",
      isActive: location.startsWith("/profile"),
      tourId: "profile"
    },
    { 
      path: "/profile/settings", 
      icon: "fas fa-cog", 
      label: "Settings",
      isActive: location.startsWith("/profile/settings"),
      tourId: "settings"
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
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border md:hidden z-50 rounded-t-2xl mx-1 mb-1">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ease-in-out min-w-[60px]",
              "hover:bg-accent/50 active:scale-95",
              item.isActive 
                ? "text-primary bg-primary/10 scale-105" 
                : "text-muted-foreground hover:text-foreground"
            )}
            data-tour={item.tourId}
          >
            <i 
              className={cn(
                item.icon, 
                "text-lg mb-1 transition-transform duration-200",
                item.isActive && "scale-110"
              )} 
            />
            <span className={cn(
              "text-xs font-medium transition-all duration-200",
              item.isActive && "font-semibold"
            )}>
              {item.label}
            </span>
            {item.isActive && (
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}