
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Star, Calendar, Coins } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import ConfettiExplosion from 'react-confetti-explosion';

interface DailySignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  pointsToAward: number;
  currentStreak: number;
}

export function DailySignInModal({ isOpen, onClose, pointsToAward, currentStreak }: DailySignInModalProps) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleClaimPoints = async () => {
    try {
      setIsClaiming(true);
      await apiRequest('POST', '/api/daily-signin/claim');
      
      setClaimed(true);
      setShowConfetti(true);
      
      // Hide confetti after animation
      setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
      
      // Refresh user data and notifications
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-signin/status'] });

      toast({
        title: "🎉 Daily Sign-In Bonus Claimed!",
        description: `You earned ${pointsToAward} points! Current streak: ${currentStreak} days`,
        duration: 5000,
      });

      // Auto-close after 3 seconds to let confetti finish
      setTimeout(() => {
        handleClose();
      }, 3000);
      
    } catch (error: any) {
      console.error('Error claiming daily sign-in:', error);
      
      // If already claimed or other error, just close the modal
      if (error.message?.includes('already claimed') || error.message?.includes('400')) {
        toast({
          title: "Already Claimed",
          description: "You've already claimed your daily bonus today!",
          variant: "default",
        });
        handleClose();
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to claim daily sign-in bonus",
          variant: "destructive",
        });
        // Close modal even on error to prevent it from being stuck
        setTimeout(handleClose, 2000);
      }
    } finally {
      setIsClaiming(false);
    }
  };

  const handleSkip = () => {
    // This will add the notification to their notifications list
    handleClose();
  };

  const handleClose = () => {
    setClaimed(false);
    setShowConfetti(false);
    setIsClaiming(false);
    onClose();
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setClaimed(false);
      setShowConfetti(false);
      setIsClaiming(false);
    }
  }, [isOpen]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-sm rounded-3xl border-0 shadow-2xl overflow-hidden">
          {/* Confetti positioned relative to modal */}
          {showConfetti && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
              <ConfettiExplosion 
                force={0.8}
                duration={3000}
                particleCount={100}
                width={1600}
                colors={['#FFD700', '#FFA500', '#FF6347', '#32CD32', '#1E90FF']}
              />
            </div>
          )}
          
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-orange-500/20 to-red-500/20 -z-10 rounded-3xl" />
          
          <DialogHeader className="pb-2">
            <DialogTitle className="text-center text-lg font-bold text-gray-800 dark:text-gray-200">
              {claimed ? "🎉 Bonus Claimed!" : "🌅 Daily Bonus"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4 py-2">
            {/* Main icon with animated glow */}
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                <Star className="w-3 h-3 text-white" />
              </div>
            </div>
            
            {/* Points display */}
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                +{pointsToAward} Points
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {claimed ? "Successfully claimed!" : "Welcome back bonus"}
              </p>
            </div>
            
            {/* Streak indicator */}
            <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {currentStreak} day streak
              </span>
            </div>
            
            {/* Action buttons */}
            {!claimed ? (
              <div className="flex gap-2 w-full pt-2">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1 rounded-xl text-xs h-10"
                  disabled={isClaiming}
                >
                  Later
                </Button>
                <Button
                  onClick={handleClaimPoints}
                  disabled={isClaiming}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-xl text-xs h-10 font-medium"
                >
                  {isClaiming ? (
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Claiming...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <Coins className="w-3 h-3" />
                      <span>Claim Now</span>
                    </div>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-1 pt-2">
                <div className="text-green-600 dark:text-green-400 font-medium text-sm">
                  ✓ Bonus claimed successfully!
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Come back tomorrow for more!
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
