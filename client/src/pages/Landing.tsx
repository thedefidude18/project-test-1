import { useAuth } from "@/hooks/useAuth";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeProvider";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthModal } from "@/components/AuthModal";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    // Extract referral code from URL
    if (params.code) {
      setReferralCode(params.code);
      localStorage.setItem('referralCode', params.code);
      toast({
        title: "Referral Code Applied!",
        description: `You'll get bonus rewards when you sign up with code: ${params.code}`,
      });
    }

    if (isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation, params.code, toast]);

  const handleGetStarted = () => {
    // Store referral code before showing auth modal
    if (referralCode) {
      localStorage.setItem('referralCode', referralCode);
    }
    setShowAuthModal(true);
  };

  const handleSignIn = () => {
    setShowAuthModal(true);
  };

  // Mascot SVG Components
  const PinkMascot = () => (
    <motion.div 
      className="relative"
      animate={{ 
        y: [0, -10, 0],
        rotate: [0, 2, -2, 0]
      }}
      transition={{ 
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <svg width="120" height="120" viewBox="0 0 120 120" className="drop-shadow-lg">
        <defs>
          <radialGradient id="pinkGradient" cx="0.3" cy="0.3">
            <stop offset="0%" stopColor="#fce7f3" />
            <stop offset="100%" stopColor="#f472b6" />
          </radialGradient>
        </defs>
        <ellipse cx="60" cy="60" rx="45" ry="35" fill="url(#pinkGradient)" />
        <circle cx="45" cy="55" r="3" fill="#1f2937" />
        <circle cx="75" cy="55" r="3" fill="#1f2937" />
        <path d="M50 65 Q60 75 70 65" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    </motion.div>
  );

  const OrangeMascot = () => (
    <motion.div 
      className="relative"
      animate={{ 
        y: [0, -8, 0],
        rotate: [0, -2, 2, 0]
      }}
      transition={{ 
        duration: 3.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 0.5
      }}
    >
      <svg width="130" height="130" viewBox="0 0 130 130" className="drop-shadow-lg">
        <defs>
          <radialGradient id="orangeGradient" cx="0.3" cy="0.3">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="100%" stopColor="#f97316" />
          </radialGradient>
        </defs>
        <g transform="translate(65, 65)">
          <circle cx="-15" cy="-10" r="20" fill="url(#orangeGradient)" />
          <circle cx="15" cy="-5" r="18" fill="url(#orangeGradient)" />
          <circle cx="0" cy="10" r="22" fill="url(#orangeGradient)" />
          <circle cx="-10" cy="25" r="16" fill="url(#orangeGradient)" />
          <circle cx="12" cy="20" r="14" fill="url(#orangeGradient)" />
        </g>
        <circle cx="55" cy="60" r="2.5" fill="#1f2937" />
        <circle cx="75" cy="65" r="2.5" fill="#1f2937" />
        <path d="M60 70 Q65 80 70 70" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    </motion.div>
  );

  const FloatingElements = () => (
    <>
      {/* Floating stars and shapes */}
      <motion.div 
        className="absolute top-20 left-1/4 text-yellow-400 text-2xl"
        animate={{ 
          rotate: [0, 360],
          scale: [1, 1.2, 1]
        }}
        transition={{ 
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        ⭐
      </motion.div>
      <motion.div 
        className="absolute top-32 right-1/3 text-gray-300 dark:text-gray-600 text-xl"
        animate={{ 
          y: [0, -20, 0],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      >
        ⭐
      </motion.div>
      <motion.div 
        className="absolute top-16 right-1/4 text-yellow-300 text-lg"
        animate={{ 
          rotate: [0, -360],
          scale: [1, 1.3, 1]
        }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      >
        ⭐
      </motion.div>
      <motion.div 
        className="absolute bottom-40 left-1/5 text-pink-300 text-sm"
        animate={{ 
          y: [0, -15, 0],
          rotate: [0, 180, 360]
        }}
        transition={{ 
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5
        }}
      >
        💫
      </motion.div>
      <motion.div 
        className="absolute bottom-32 right-1/5 text-orange-200 text-lg"
        animate={{ 
          scale: [1, 1.4, 1],
          opacity: [0.6, 1, 0.6]
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8
        }}
      >
        ✨
      </motion.div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500">
      {/* Header */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-slate-700/50 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                BetChat <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">by BetChat</span>
              </span>
            </div>

            {/* Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <div className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer transition-colors">
                <span className="text-sm font-medium">Resources</span>
                <ChevronDown className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer transition-colors">
                Pricing
              </span>
              <span 
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer transition-colors"
                onClick={handleSignIn}
              >
                Sign in
              </span>
              <Button
                variant="outline"
                size="sm"
                className="text-sm font-medium border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                onClick={handleGetStarted}
              >
                Try for free
              </Button>
              <Button
                size="sm"
                className="text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                onClick={handleGetStarted}
              >
                Sign in
              </Button>
            </div>

            {/* Mobile menu button and theme toggle */}
            <div className="flex items-center space-x-3 md:hidden">
              <ThemeToggle />
              <Button
                size="sm"
                className="text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                onClick={handleGetStarted}
              >
                Sign in
              </Button>
            </div>

            {/* Theme toggle for desktop */}
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <FloatingElements />
        
        <div className="max-w-6xl mx-auto px-6 lg:px-8 pt-20 pb-16 text-center">
          {/* Referral Code Banner */}
          {referralCode && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-xl p-4 mb-8 max-w-md mx-auto"
            >
              <div className="text-center">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  🎁 Referral Code Applied: <span className="font-bold">{referralCode}</span>
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  You'll get bonus rewards when you sign up!
                </p>
              </div>
            </motion.div>
          )}

          {/* Mascots */}
          <div className="relative mb-12">
            <div className="flex justify-center items-center space-x-8">
              <PinkMascot />
              <OrangeMascot />
            </div>
          </div>

          {/* Hero Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Bring joy to
              <br />
              <span className="block mt-2">your workplace.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              BetChat is the social betting platform your
              <br className="hidden md:block" />
              employees & team will love.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Button
                size="lg"
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={handleGetStarted}
              >
                {referralCode ? 'Sign Up with Bonus' : 'Sign in'}
              </Button>
            </motion.div>
          </motion.div>

          {/* Product Demo */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-20"
          >
            <div className="relative">
              {/* Laptop Frame */}
              <div className="bg-gradient-to-b from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 rounded-t-2xl p-4 shadow-2xl max-w-4xl mx-auto">
                {/* Laptop Screen Bezel */}
                <div className="bg-black rounded-xl p-3 shadow-inner">
                  {/* Notch */}
                  <div className="bg-gray-900 dark:bg-gray-800 h-6 w-32 mx-auto rounded-b-xl mb-2"></div>
                  
                  {/* Screen Content - Mimicking the attached image */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg aspect-video flex flex-col relative overflow-hidden">
                    {/* Mock Browser Interface */}
                    <div className="bg-gray-100 dark:bg-gray-800 h-12 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="flex-1 flex justify-center">
                        <div className="bg-white dark:bg-gray-700 rounded-lg px-4 py-1 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                          betchat.com
                        </div>
                      </div>
                    </div>
                    
                    {/* Mock App Interface */}
                    <div className="flex-1 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 p-6">
                      {/* Mock Navigation Bar */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 mb-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-blue-500 rounded"></div>
                            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">BetChat</div>
                          </div>
                          <div className="flex space-x-2">
                            <div className="w-16 h-6 bg-gray-200 dark:bg-gray-600 rounded"></div>
                            <div className="w-12 h-6 bg-gray-900 dark:bg-white rounded"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Mock Content Area */}
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                          <div className="w-full h-3 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                          <div className="w-3/4 h-2 bg-gray-100 dark:bg-gray-700 rounded mb-1"></div>
                          <div className="w-1/2 h-2 bg-gray-100 dark:bg-gray-700 rounded"></div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                          <div className="w-full h-3 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                          <div className="w-2/3 h-2 bg-gray-100 dark:bg-gray-700 rounded mb-1"></div>
                          <div className="w-3/4 h-2 bg-gray-100 dark:bg-gray-700 rounded"></div>
                        </div>
                      </div>
                      
                      {/* Mock Chart/Graph Area */}
                      <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-end space-x-1 h-16">
                          <div className="w-4 bg-blue-400 h-8 rounded-t"></div>
                          <div className="w-4 bg-purple-400 h-12 rounded-t"></div>
                          <div className="w-4 bg-pink-400 h-6 rounded-t"></div>
                          <div className="w-4 bg-orange-400 h-10 rounded-t"></div>
                          <div className="w-4 bg-green-400 h-14 rounded-t"></div>
                          <div className="w-4 bg-blue-400 h-9 rounded-t"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Laptop Base */}
              <div className="bg-gradient-to-b from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 h-4 rounded-b-2xl max-w-5xl mx-auto shadow-lg"></div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}