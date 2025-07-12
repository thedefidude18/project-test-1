import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface EventCardProps {
  event: {
    id: number;
    title: string;
    description?: string;
    category: string;
    status: string;
    yesPool: string;
    noPool: string;
    entryFee: string;
    endDate: string;
    createdAt: string;
  };
  featured?: boolean;
}

export function EventCard({ event, featured = false }: EventCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'crypto': return 'fab fa-bitcoin';
      case 'sports': return 'fas fa-football-ball';
      case 'gaming': return 'fas fa-gamepad';
      case 'music': return 'fas fa-music';
      case 'politics': return 'fas fa-landmark';
      default: return 'fas fa-calendar';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'crypto': return 'text-orange-500';
      case 'sports': return 'text-blue-500';
      case 'gaming': return 'text-purple-500';
      case 'music': return 'text-pink-500';
      case 'politics': return 'text-red-500';
      default: return 'text-slate-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">Active</Badge>;
      case 'completed':
        return <Badge className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">Cancelled</Badge>;
      default:
        return <Badge className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">Live</Badge>;
    }
  };

  const totalPool = parseFloat(event.yesPool) + parseFloat(event.noPool);
  const yesPercentage = totalPool > 0 ? (parseFloat(event.yesPool) / totalPool) * 100 : 50;
  const noPercentage = 100 - yesPercentage;

  const timeLeft = formatDistanceToNow(new Date(event.endDate), { addSuffix: true });

  const containerClass = featured 
    ? "gradient-border" 
    : "bg-slate-50 dark:bg-slate-700 theme-transition";

  const innerClass = featured 
    ? "bg-white dark:bg-slate-800 theme-transition" 
    : "";

  return (
    <div className={containerClass}>
      <Card className={`${innerClass} border-slate-200 dark:border-slate-600`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 bg-${getCategoryColor(event.category).split('-')[1]}-100 dark:bg-${getCategoryColor(event.category).split('-')[1]}-900 rounded-lg flex items-center justify-center`}>
                <i className={`${getCategoryIcon(event.category)} ${getCategoryColor(event.category)}`}></i>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{event.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                  {event.category} • Ends {timeLeft}
                </p>
              </div>
            </div>
            {getStatusBadge(event.status)}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">YES</span>
                <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  ₦{parseFloat(event.yesPool).toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400">
                {yesPercentage.toFixed(1)}% of pool
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-700 dark:text-red-300">NO</span>
                <span className="text-lg font-bold text-red-700 dark:text-red-300">
                  ₦{parseFloat(event.noPool).toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-red-600 dark:text-red-400">
                {noPercentage.toFixed(1)}% of pool
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                <i className="fas fa-ticket-alt mr-1"></i>
                Entry: ₦{parseFloat(event.entryFee).toLocaleString()}
              </span>
            </div>
            <Button 
              className="bg-primary text-white hover:bg-primary/90"
              onClick={() => window.location.href = `/events/${event.id}/chat`}
            >
              Join Event
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
