
import React, { useState } from "react";
import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Trophy, 
  Target, 
  Users, 
  Settings,
  Menu,
  X,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/admin', 
      icon: LayoutDashboard, 
      current: location === '/admin' 
    },
    { 
      name: 'Event Payouts', 
      href: '/admin/events', 
      icon: Trophy, 
      current: location === '/admin/events' 
    },
    { 
      name: 'Challenge Payouts', 
      href: '/admin/challenges', 
      icon: Target, 
      current: location === '/admin/challenges' 
    },
    { 
      name: 'Users Management', 
      href: '/admin/users', 
      icon: Users, 
      current: location === '/admin/users' 
    },
  ];

  const closeSidebar = () => setIsSidebarOpen(false);

  // Check if user is admin (basic check)
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400">Please log in to access the admin panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <Activity className="w-8 h-8 text-blue-400" />
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeSidebar}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => {
                  setLocation(item.href);
                  closeSidebar();
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  item.current
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {user.firstName?.[0] || user.username?.[0] || 'A'}
              </span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">
                {user.firstName || user.username || 'Admin'}
              </p>
              <p className="text-slate-400 text-xs">Administrator</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:ml-64">
        {/* Mobile header */}
        <div className="md:hidden bg-slate-800 p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(true)}
              className="text-slate-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </Button>
            <h1 className="text-lg font-semibold text-white">Admin Panel</h1>
            <div className="w-8" /> {/* Spacer */}
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
