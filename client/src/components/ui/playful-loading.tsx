import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "./loading-spinner";
import { cn } from "@/lib/utils";

export type LoadingType = "betting" | "wallet" | "trophy" | "chat" | "rocket" | "general";

interface PlayfulLoadingProps {
  type?: LoadingType;
  title?: string;
  description?: string;
  className?: string;
}

const loadingConfigs = {
  betting: {
    icon: "🎲",
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
    icon: "💰",
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
    icon: "🏆",
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
    icon: "💬",
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
    icon: "🚀",
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
    icon: "⚡",
    defaultTitle: "Loading",
    defaultDescription: "Getting things ready...",
    messages: [
      "Loading data...",
      "Preparing content...",
      "Almost there...",
      "Just a moment..."
    ]
  }
};

export function PlayfulLoading({
  type = "general",
  title,
  description,
  className
}: PlayfulLoadingProps) {
  const config = loadingConfigs[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn("flex flex-col items-center justify-center p-8", className)}
    >
      <motion.div
        className="text-6xl mb-4"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {config.icon}
      </motion.div>

      <LoadingSpinner className="mb-4" />

      <h3 className="text-lg font-semibold mb-2">
        {title || config.defaultTitle}
      </h3>

      <p className="text-sm text-muted-foreground text-center max-w-xs">
        {description || config.defaultDescription}
      </p>
    </motion.div>
  );
}

export function PlayfulLoadingOverlay({
  type = "general",
  title,
  description
}: PlayfulLoadingProps) {
  const config = loadingConfigs[type];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <Card className="p-8 max-w-sm">
        <PlayfulLoading
          type={type}
          title={title}
          description={description}
        />
      </Card>
    </motion.div>
  );
}