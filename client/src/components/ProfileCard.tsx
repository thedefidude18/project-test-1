
import React, { useState, useEffect } from 'react';
import { X, Trophy, Users, TrendingUp, Star, Send, Zap, Swords } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { formatBalance } from "@/utils/currencyUtils";

interface ProfileCardProps {
  userId: string;
  onClose: () => void;
}

interface UserProfile {
  id: string;
  username: string;
  firstName?: string;
  email: string;
  profileImageUrl?: string;
  points: number;
  level: number;
  xp: number;
  streak: number;
  createdAt: string;
  isFollowing?: boolean;
  followerCount?: number;
  followingCount?: number;
  stats?: {
    wins: number;
    activeChallenges: number;
    totalEarnings: number;
  };
}

const ProfileCard: React.FC<ProfileCardProps> = ({ userId, onClose }) => {
  const [showTipModal, setShowTipModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showMilestoneAnimation, setShowMilestoneAnimation] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeDescription, setChallengeDescription] = useState('');
  const [challengeAmount, setChallengeAmount] = useState('');
  const [challengeType, setChallengeType] = useState('prediction');
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}/profile`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${userId}/profile`);
      return response as UserProfile;
    },
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async (action: 'follow' | 'unfollow') => {
      return await apiRequest("POST", `/api/users/${userId}/${action}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/profile`] });
      toast({
        title: "Success",
        description: profile?.isFollowing ? "User unfollowed" : "User followed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Tip mutation
  const tipMutation = useMutation({
    mutationFn: async (amount: number) => {
      return await apiRequest("POST", `/api/wallet/transfer`, {
        recipientId: userId,
        amount,
        type: 'tip'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      toast({
        title: "Tip Sent",
        description: `Successfully sent ${formatBalance(parseInt(tipAmount))} to ${profile?.firstName || profile?.username}`,
      });
      setShowTipModal(false);
      setTipAmount('');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Challenge mutation
  const challengeMutation = useMutation({
    mutationFn: async (challengeData: any) => {
      return await apiRequest("POST", `/api/challenges`, {
        ...challengeData,
        challenged: userId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      toast({
        title: "Challenge Sent",
        description: `Challenge sent to ${profile?.firstName || profile?.username}`,
      });
      setShowChallengeModal(false);
      setChallengeTitle('');
      setChallengeDescription('');
      setChallengeAmount('');
      setChallengeType('prediction');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFollow = () => {
    followMutation.mutate(profile?.isFollowing ? 'unfollow' : 'follow');
  };

  const handleTip = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(tipAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    tipMutation.mutate(amount);
  };

  const handleChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(challengeAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid stake amount",
        variant: "destructive",
      });
      return;
    }

    challengeMutation.mutate({
      title: challengeTitle,
      description: challengeDescription,
      amount,
      type: challengeType,
    });
  };

  // XP Milestone Animation Effect
  useEffect(() => {
    if (profile) {
      const nextLevelXP = profile.level * 1000;
      const currentLevelXP = (profile.level - 1) * 1000;
      const progressXP = profile.xp - currentLevelXP;
      
      // Check if user is close to next level (within 50 XP)
      if (nextLevelXP - profile.xp <= 50) {
        setShowMilestoneAnimation(true);
        setTimeout(() => setShowMilestoneAnimation(false), 3000);
      }
    }
  }, [profile]);

  const MilestoneAnimation = () => (
    <AnimatePresence>
      {showMilestoneAnimation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg flex items-center justify-center"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-yellow-500"
          >
            <Zap className="w-8 h-8" />
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="ml-3 text-yellow-700 dark:text-yellow-300 font-bold"
          >
            Almost Level {profile?.level + 1}!
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <CardContent className="p-6">
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const calculateLevel = (xp: number) => Math.floor(xp / 1000) + 1;
  const currentLevelXP = (profile.level - 1) * 1000;
  const nextLevelXP = profile.level * 1000;
  const progressXP = profile.xp - currentLevelXP;
  const levelProgress = (progressXP / (nextLevelXP - currentLevelXP)) * 100;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <Card className="w-full max-w-md bg-white dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
          <CardContent className="p-6 relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-2 right-2 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="text-center space-y-4">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center space-y-3">
                <Avatar className="w-20 h-20">
                  <AvatarImage 
                    src={profile.profileImageUrl || undefined} 
                    alt={profile.firstName || profile.username} 
                  />
                  <AvatarFallback className="text-2xl">
                    {(profile.firstName?.[0] || profile.username?.[0] || '?').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {profile.firstName || profile.username}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">@{profile.username || 'unknown'}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Joined {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
                  </p>
                </div>

                {/* Level and Points */}
                <div className="flex items-center space-x-2">
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <Star className="w-3 h-3 mr-1" />
                    Level {profile.level}
                  </Badge>
                  <Badge variant="secondary">
                    {profile.points} Points
                  </Badge>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                  <Trophy className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {profile.stats?.wins || 0}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Wins</div>
                </div>
                
                <div className="text-center bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                  <Users className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {profile.followerCount || 0}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Followers</div>
                </div>
                
                <div className="text-center bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                  <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {profile.streak}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Streak</div>
                </div>
              </div>

              {/* XP Progress Bar with Animation */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Level {profile.level}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {profile.xp} / {profile.level * 1000} XP
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <MilestoneAnimation />
              </div>

              {/* Action Buttons */}
              {currentUser && currentUser.id !== profile.id && (
                <div className="grid grid-cols-3 gap-2 pt-4">
                  <Button
                    onClick={handleFollow}
                    disabled={followMutation.isPending}
                    variant={profile.isFollowing ? "outline" : "default"}
                    size="sm"
                  >
                    {followMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      profile.isFollowing ? 'Unfollow' : 'Follow'
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => setShowChallengeModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                  >
                    <Swords className="w-4 h-4 mr-1" />
                    Challenge
                  </Button>
                  
                  <Button
                    onClick={() => setShowTipModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    size="sm"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Tip
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Challenge Modal */}
      <Dialog open={showChallengeModal} onOpenChange={setShowChallengeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Challenge {profile.firstName || profile.username}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleChallenge} className="space-y-4">
            <div>
              <Label htmlFor="challengeTitle">Challenge Title</Label>
              <Input
                id="challengeTitle"
                value={challengeTitle}
                onChange={(e) => setChallengeTitle(e.target.value)}
                placeholder="Enter challenge title"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="challengeDescription">Description</Label>
              <Textarea
                id="challengeDescription"
                value={challengeDescription}
                onChange={(e) => setChallengeDescription(e.target.value)}
                placeholder="Describe the challenge..."
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="challengeType">Challenge Type</Label>
              <Select value={challengeType} onValueChange={setChallengeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prediction">Prediction Challenge</SelectItem>
                  <SelectItem value="skill">Skill Challenge</SelectItem>
                  <SelectItem value="trivia">Trivia Challenge</SelectItem>
                  <SelectItem value="custom">Custom Challenge</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="challengeAmount">Stake Amount</Label>
              <Input
                id="challengeAmount"
                type="number"
                value={challengeAmount}
                onChange={(e) => setChallengeAmount(e.target.value)}
                placeholder="Enter stake amount"
                min="1"
                required
              />
            </div>
            
            <div className="flex space-x-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowChallengeModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={challengeMutation.isPending || !challengeTitle || !challengeAmount}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {challengeMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <>
                    <Swords className="w-4 h-4 mr-2" />
                    Send Challenge
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tip Modal */}
      <Dialog open={showTipModal} onOpenChange={setShowTipModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tip {profile.firstName || profile.username}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleTip} className="space-y-4">
            <div>
              <Label htmlFor="tipAmount">Amount</Label>
              <Input
                id="tipAmount"
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
                required
              />
            </div>
            
            <div className="flex space-x-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowTipModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={tipMutation.isPending || !tipAmount}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {tipMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Tip
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileCard;
