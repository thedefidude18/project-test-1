import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

interface LoadingCardProps {
  title?: string;
  description?: string;
  icon?: string;
  className?: string;
}

export function LoadingCard({ title, description, icon, className }: LoadingCardProps) {
  return (
    <Card className={cn("p-6 text-center", className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4"
      >
        {icon && (
          <motion.div
            className="text-4xl mx-auto"
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {icon}
          </motion.div>
        )}
        
        <div className="space-y-2">
          <LoadingSpinner variant="dots" className="justify-center" />
          {title && (
            <motion.h3 
              className="text-lg font-semibold"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {title}
            </motion.h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </motion.div>
    </Card>
  );
}

export function SkeletonCard() {
  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <motion.div
          className="h-4 bg-muted rounded animate-pulse"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="h-4 bg-muted rounded w-3/4 animate-pulse"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.5,
            delay: 0.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      <div className="space-y-2">
        <motion.div
          className="h-3 bg-muted rounded animate-pulse"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.5,
            delay: 0.4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="h-3 bg-muted rounded w-1/2 animate-pulse"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.5,
            delay: 0.6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
    </Card>
  );
}

export function LoadingOverlay({ 
  isVisible, 
  message = "Loading...", 
  character = "🎯" 
}: { 
  isVisible: boolean; 
  message?: string; 
  character?: string; 
}) {
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
        className="bg-card p-8 rounded-lg shadow-lg border text-center max-w-sm"
      >
        <motion.div
          className="text-6xl mb-4"
          animate={{
            rotate: [0, 15, -15, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {character}
        </motion.div>
        
        <LoadingSpinner variant="dots" className="justify-center mb-4" />
        
        <motion.p
          className="text-lg font-medium"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {message}
        </motion.p>
      </motion.div>
    </motion.div>
  );
}