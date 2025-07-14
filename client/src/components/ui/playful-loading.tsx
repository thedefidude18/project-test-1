import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { 
  BettingDiceCharacter, 
  WalletCharacter, 
  TrophyCharacter, 
  ChatBubbleCharacter, 
  RocketCharacter 
} from "./character-illustrations";
import { LoadingSpinner } from "./loading-spinner";
import { cn } from "@/lib/utils";

interface PlayfulLoadingProps {
  type: "betting" | "wallet" | "trophy" | "chat" | "rocket" | "general";
  title?: string;
  description?: string;
  className?: string;
}

const loadingConfigs = {
  betting: {
    character: BettingDiceCharacter,
    defaultTitle: "Placing Your Bet",
    defaultDescription: "Rolling the dice of fortune...",
    messages: [
      "Calculating odds...",
      "Shuffling the deck...",
      "Reading the crystal ball...",
      "Consulting the betting spirits..."
    ]
  },
  wallet: {
    character: WalletCharacter,
    defaultTitle: "Processing Payment",
    defaultDescription: "Counting your coins...",
    messages: [
      "Securing your funds...",
      "Updating your balance...",
      "Processing transaction...",
      "Organizing your wallet..."
    ]
  },
  trophy: {
    character: TrophyCharacter,
    defaultTitle: "Calculating Results",
    defaultDescription: "Preparing your victory...",
    messages: [
      "Tallying scores...",
      "Polishing trophies...",
      "Preparing celebration...",
      "Checking leaderboards..."
    ]
  },
  chat: {
    character: ChatBubbleCharacter,
    defaultTitle: "Loading Messages",
    defaultDescription: "Gathering conversations...",
    messages: [
      "Collecting messages...",
      "Synchronizing chat...",
      "Loading conversations...",
      "Preparing your inbox..."
    ]
  },
  rocket: {
    character: RocketCharacter,
    defaultTitle: "Launching",
    defaultDescription: "Preparing for takeoff...",
    messages: [
      "Fueling rockets...",
      "Checking systems...",
      "Preparing launch...",
      "Countdown initiated..."
    ]
  },
  general: {
    character: BettingDiceCharacter,
    defaultTitle: "Loading",
    defaultDescription: "Just a moment...",
    messages: [
      "Loading...",
      "Almost there...",
      "Preparing content...",
      "Getting things ready..."
    ]
  }
};

export function PlayfulLoading({ 
  type, 
  title, 
  description, 
  className 
}: PlayfulLoadingProps) {
  const config = loadingConfigs[type] || loadingConfigs.general;
  const Character = config.character;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("flex flex-col items-center space-y-6 p-8", className)}
    >
      <Character className="w-20 h-20" />
      
      <div className="text-center space-y-2">
        <motion.h3 
          className="text-xl font-semibold"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {title || config.defaultTitle}
        </motion.h3>
        
        <p className="text-muted-foreground">
          {description || config.defaultDescription}
        </p>
      </div>
      
      <LoadingSpinner variant="dots" className="justify-center" />
    </motion.div>
  );
}

export function PlayfulLoadingCard({ 
  type, 
  title, 
  description, 
  className 
}: PlayfulLoadingProps) {
  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <PlayfulLoading 
        type={type} 
        title={title} 
        description={description} 
      />
    </Card>
  );
}

export function PlayfulLoadingOverlay({
  isVisible,
  type,
  title,
  description
}: PlayfulLoadingProps & { isVisible: boolean }) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PlayfulLoadingCard 
          type={type}
          title={title}
          description={description}
        />
      </motion.div>
    </motion.div>
  );
}

export function InlinePlayfulLoading({ 
  type, 
  size = "sm",
  className 
}: { 
  type: PlayfulLoadingProps['type']; 
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const config = loadingConfigs[type];
  const Character = config.character;
  
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };
  
  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <Character className={sizeClasses[size]} />
      <div className="flex items-center space-x-2">
        <LoadingSpinner variant="dots" size="sm" />
        <span className="text-sm text-muted-foreground">
          {config.defaultTitle}...
        </span>
      </div>
    </div>
  );
}