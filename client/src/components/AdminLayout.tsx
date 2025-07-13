import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard,
  Trophy,
  Target,
  DollarSign,
  Users,
  Settings,
  Menu,
  X,
  LogOut
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, current: location === '/admin' },
    { name: 'Event Payouts', href: '/admin/events', icon: Trophy, current: location === '/admin/events' },
    { name: 'Challenge Payouts', href: '/admin/challenges', icon: Target, current: location === '/admin/challenges' },
    { name: 'Users', href: '/admin/users', icon: Users, current: location === '/admin/users' },
    { name: 'Settings', href: '/admin/settings', icon: Settings, current: location === '/admin/settings' },
  ];

  const closeSidebar = () => setIsSidebarOpen(false);

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
      <div className={`fixed inset-y-0 left-0 w-64 bg-slate-800 transform transition-transform duration-300 ease-in-out z-50 md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:static md:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 bg-slate-900">
          <div className="flex items-center">
            <Trophy className="w-8 h-8 text-blue-400" />
            <span className="ml-2 text-xl font-bold text-white">Admin Panel</span>
          </div>
          <button
            onClick={closeSidebar}
            className="md:hidden p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeSidebar}
                >
                  <div className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.current
                      ? 'bg-blue-700 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}>
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-900">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-700"
            onClick={() => setLocation('/')}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Back to App
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="md:ml-64">
        {/* Top bar */}
        <div className="bg-slate-800 px-4 py-3 flex items-center justify-between md:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">Admin Panel</h1>
          <div className="w-9" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;