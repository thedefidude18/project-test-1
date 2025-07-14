import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight, ArrowLeft, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  route: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'none';
  delay?: number;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to BetChat! 🎉',
    description: 'Let\'s take a quick tour of the social betting platform where you can predict events, challenge friends, and win rewards.',
    target: '',
    route: '/',
    position: 'center',
    action: 'none',
    delay: 0
  },
  {
    id: 'events',
    title: 'Events & Predictions',
    description: 'Browse and participate in prediction events across crypto, sports, gaming, and more. Place your bets and compete with others!',
    target: '[data-tour="events"]',
    route: '/events',
    position: 'bottom',
    action: 'click'
  },
  {
    id: 'challenges',
    title: 'P2P Challenges',
    description: 'Challenge friends directly with custom bets. Your stakes are held in secure escrow until resolution.',
    target: '[data-tour="challenges"]',
    route: '/challenges',
    position: 'bottom',
    action: 'click'
  },
  {
    id: 'wallet',
    title: 'Your Wallet',
    description: 'Manage your balance, deposits, and withdrawals. Track your earnings and transaction history.',
    target: '[data-tour="wallet"]',
    route: '/wallet',
    position: 'bottom',
    action: 'click'
  },
  {
    id: 'friends',
    title: 'Friends & Social',
    description: 'Connect with friends, compare performance, and see who\'s winning. Build your social network!',
    target: '[data-tour="friends"]',
    route: '/friends',
    position: 'bottom',
    action: 'click'
  },
  {
    id: 'profile',
    title: 'Your Profile',
    description: 'View your stats, level, achievements, and customize your profile settings.',
    target: '[data-tour="profile"]',
    route: '/profile',
    position: 'left',
    action: 'click'
  },
  {
    id: 'notifications',
    title: 'Stay Updated',
    description: 'Get notified about challenge results, friend activities, and important updates.',
    target: '[data-tour="notifications"]',
    route: '/notifications',
    position: 'left',
    action: 'click'
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🚀',
    description: 'That\'s it! You\'re ready to start betting, challenging friends, and earning rewards. Have fun!',
    target: '',
    route: '/',
    position: 'center',
    action: 'none'
  }
];

interface WebsiteTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WebsiteTour({ isOpen, onClose }: WebsiteTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [, navigate] = useLocation();

  const currentTourStep = tourSteps[currentStep];

  // Auto-advance tour when playing
  useEffect(() => {
    if (!isPlaying || !isOpen) return;

    const timer = setTimeout(() => {
      if (currentStep < tourSteps.length - 1) {
        handleNext();
      } else {
        setIsPlaying(false);
        onClose();
      }
    }, currentTourStep.delay || 4000);

    return () => clearTimeout(timer);
  }, [currentStep, isPlaying, isOpen, onClose]);

  // Navigate to route when step changes
  useEffect(() => {
    if (isOpen && currentTourStep.route) {
      navigate(currentTourStep.route);
    }
  }, [currentStep, isOpen, navigate]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsPlaying(false);
    onClose();
  };

  const getTooltipPosition = (): React.CSSProperties => {
    if (currentTourStep.position === 'center') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000
      };
    }

    const target = document.querySelector(currentTourStep.target);
    if (!target) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000
      };
    }

    const rect = target.getBoundingClientRect();
    const style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1000
    };

    switch (currentTourStep.position) {
      case 'top':
        style.bottom = window.innerHeight - rect.top + 10;
        style.left = rect.left + rect.width / 2;
        style.transform = 'translateX(-50%)';
        break;
      case 'bottom':
        style.top = rect.bottom + 10;
        style.left = rect.left + rect.width / 2;
        style.transform = 'translateX(-50%)';
        break;
      case 'left':
        style.right = window.innerWidth - rect.left + 10;
        style.top = rect.top + rect.height / 2;
        style.transform = 'translateY(-50%)';
        break;
      case 'right':
        style.left = rect.right + 10;
        style.top = rect.top + rect.height / 2;
        style.transform = 'translateY(-50%)';
        break;
    }

    return style;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Spotlight effect */}
      {currentTourStep.target && (
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute border-2 border-white/30 rounded-lg shadow-2xl"
            style={(() => {
              const target = document.querySelector(currentTourStep.target);
              if (!target) return {};
              
              const rect = target.getBoundingClientRect();
              return {
                left: rect.left - 4,
                top: rect.top - 4,
                width: rect.width + 8,
                height: rect.height + 8,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
              };
            })()}
          />
        </div>
      )}

      {/* Tour tooltip */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          style={getTooltipPosition()}
        >
          <Card className="w-80 bg-white dark:bg-slate-900 border-0 shadow-2xl">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {currentStep + 1} / {tourSteps.length}
                  </Badge>
                  <h3 className="font-semibold text-lg">{currentTourStep.title}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-6">
                {currentTourStep.description}
              </p>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex items-center space-x-1"
                  >
                    {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    <span>{isPlaying ? 'Pause' : 'Auto'}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Skip Tour
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="flex items-center space-x-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>Back</span>
                  </Button>
                  <Button
                    onClick={currentStep === tourSteps.length - 1 ? handleSkip : handleNext}
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <span>{currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}</span>
                    {currentStep !== tourSteps.length - 1 && <ArrowRight className="h-3 w-3" />}
                  </Button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-primary h-1 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Hook to manage tour state
export function useTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('betchat-tour-completed');
    setHasCompletedTour(completed === 'true');
  }, []);

  const startTour = () => {
    setIsOpen(true);
  };

  const closeTour = () => {
    setIsOpen(false);
    localStorage.setItem('betchat-tour-completed', 'true');
    setHasCompletedTour(true);
  };

  const resetTour = () => {
    localStorage.removeItem('betchat-tour-completed');
    setHasCompletedTour(false);
  };

  return {
    isOpen,
    hasCompletedTour,
    startTour,
    closeTour,
    resetTour
  };
}