import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Star, Calendar, Coins } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

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

  // Confetti component
  const Confetti = () => {
    if (!showConfetti) return null;
    
    return (
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ['#fbbf24', '#f59e0b', '#d97706', '#92400e', '#78350f'][Math.floor(Math.random() * 5)],
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Confetti />
      <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {claimed ? "🎉 Bonus Claimed!" : "🌅 Daily Sign-In Bonus"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-4">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Gift className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Star className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-yellow-600">
              +{pointsToAward} Points
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back! Claim your daily bonus
            </p>
          </div>
          
          <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {currentStreak} day streak
            </span>
          </div>
          
          {!claimed ? (
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex-1"
                disabled={isClaiming}
              >
                Claim Later
              </Button>
              <Button
                onClick={handleClaimPoints}
                disabled={isClaiming}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              >
                {isClaiming ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Claiming...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Coins className="w-4 h-4" />
                    <span>Claim Now</span>
                  </div>
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <div className="text-green-600 dark:text-green-400 font-medium">
                ✓ Bonus claimed successfully!
              </div>
              <p className="text-sm text-gray-500">
                Keep your streak going tomorrow!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}