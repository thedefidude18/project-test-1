import { useLocation } from "wouter";

export function MobileNavigation() {
  const [location] = useLocation();

  const navItems = [
    { 
      path: "/", 
      icon: "fas fa-home", 
      label: "Home",
      isActive: location === "/"
    },
    { 
      path: "/events", 
      icon: "fas fa-calendar", 
      label: "Events",
      isActive: location.startsWith("/events")
    },
    { 
      path: "/challenges", 
      icon: "fas fa-swords", 
      label: "Challenges",
      isActive: location.startsWith("/challenges")
    },
    { 
      path: "/friends", 
      icon: "fas fa-users", 
      label: "Friends",
      isActive: location.startsWith("/friends")
    },
    { 
      path: "/profile", 
      icon: "fas fa-user", 
      label: "Profile",
      isActive: location.startsWith("/profile")
    },
  ];

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 theme-transition z-50">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            className={`flex flex-col items-center justify-center theme-transition ${
              item.isActive
                ? "text-primary"
                : "text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary"
            }`}
          >
            <i className={`${item.icon} text-lg`}></i>
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
