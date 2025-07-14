import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, Check, X, Eye, Trophy } from "lucide-react";

interface ChallengeCardProps {
  challenge: {
    id: number;
    challenger: string;
    challenged: string;
    title: string;
    description?: string;
    category: string;
    amount: string;
    status: string;
    dueDate?: string;
    createdAt: string;
    challengerUser?: {
      id: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      profileImageUrl?: string;
    };
    challengedUser?: {
      id: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      profileImageUrl?: string;
    };
  };
  onChatClick?: (challenge: any) => void;
}

export function ChallengeCard({ challenge, onChatClick }: ChallengeCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const acceptChallengeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/challenges/${challenge.id}/accept`);
    },
    onSuccess: () => {
      toast({
        title: "Challenge Accepted",
        description: "You have successfully accepted the challenge!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const declineChallengeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('PATCH', `/api/challenges/${challenge.id}`, {
        status: 'cancelled'
      });
    },
    onSuccess: () => {
      toast({
        title: "Challenge Declined",
        description: "You have declined the challenge.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">Pending</Badge>;
      case 'active':
        return <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">Active</Badge>;
      case 'completed':
        return <Badge className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">Completed</Badge>;
      case 'disputed':
        return <Badge className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">Disputed</Badge>;
      case 'cancelled':
        return <Badge className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const otherUser = challenge.challengerUser || challenge.challengedUser;
  const userName = otherUser?.firstName || otherUser?.username || 'Unknown User';
  const timeAgo = formatDistanceToNow(new Date(challenge.createdAt), { addSuffix: true });

  return (
    <Card className="border border-slate-200 dark:border-slate-600 theme-transition">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage 
                src={otherUser?.profileImageUrl || undefined} 
                alt={userName} 
              />
              <AvatarFallback>
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">{userName}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">{challenge.title}</p>
            </div>
          </div>
          {getStatusBadge(challenge.status)}
        </div>

        {challenge.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{challenge.description}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-semibold text-emerald-600">
              Stake: ₦{parseFloat(challenge.amount).toLocaleString()}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">
              {challenge.category}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {timeAgo}
            </span>
          </div>

          <div className="flex space-x-2">
            {challenge.status === 'pending' && user?.id === challenge.challenged && (
              <>
                <Button
                  size="sm"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => acceptChallengeMutation.mutate()}
                  disabled={acceptChallengeMutation.isPending}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => declineChallengeMutation.mutate()}
                  disabled={declineChallengeMutation.isPending}
                >
                  <X className="w-4 h-4 mr-1" />
                  Decline
                </Button>
              </>
            )}
            {challenge.status === 'pending' && user?.id === challenge.challenger && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => declineChallengeMutation.mutate()}
                disabled={declineChallengeMutation.isPending}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            )}
            {(challenge.status === 'active' || challenge.status === 'pending') && onChatClick && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onChatClick(challenge)}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Chat
              </Button>
            )}
            {challenge.status === 'active' && !onChatClick && (
              <Button size="sm" className="bg-primary text-white hover:bg-primary/90">
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </Button>
            )}
            {challenge.status === 'completed' && (
              <Button size="sm" variant="outline">
                <Trophy className="w-4 h-4 mr-1" />
                View Results
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
