
import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Trophy,
  Wallet,
  AlertCircle,
  Coins,
  ClipboardList,
  Newspaper,
  Plus,
  Bell,
  Users,
  Gamepad2,
  Award,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Events', href: '/admin/events', icon: Trophy },
    { name: 'Event Pools', href: '/admin/event-pools', icon: Coins },
    { name: 'Event Results', href: '/admin/event-results', icon: Award },
    { name: 'Challenges', href: '/admin/challenges', icon: Gamepad2 },
    { name: 'Create Event', href: '/admin/create-event', icon: Plus },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Payouts', href: '/admin/payouts', icon: Wallet },
    { name: 'Notifications', href: '/admin/notifications', icon: Bell },
    { name: 'Reports', href: '/admin/reports', icon: AlertCircle },
    { name: 'Audit Log', href: '/admin/audit-log', icon: ClipboardList },
  ];

  const isActive = (href: string) => location === href;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-white font-semibold">Admin Dashboard</h1>
        <button
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="text-white p-2 rounded-lg hover:bg-slate-800"
        >
          {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        ${isMobileNavOpen ? 'block' : 'hidden'} md:block
        fixed md:relative inset-0 z-50 md:z-0
        w-64 bg-slate-900 border-r border-slate-800
        md:flex md:flex-col
      `}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="text-white font-semibold text-lg">Admin Panel</div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.href);
                  setIsMobileNavOpen(false);
                }}
                className={`
                  w-full flex items-center px-4 py-3 mb-1 rounded-lg text-left
                  ${isActive(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="text-slate-400 text-sm mb-2 truncate">
            {user?.email || user?.username}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileNavOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-0 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
