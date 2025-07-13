
import React from 'react';
import { Badge } from './ui/badge';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showXP?: boolean;
  currentXP?: number;
  nextLevelXP?: number;
}

const getLevelColor = (level: number) => {
  if (level >= 50) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900';
  if (level >= 30) return 'bg-gradient-to-r from-purple-400 to-purple-600 text-white';
  if (level >= 20) return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white';
  if (level >= 10) return 'bg-gradient-to-r from-green-400 to-green-600 text-white';
  if (level >= 5) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
  return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
};

const getLevelIcon = (level: number) => {
  if (level >= 50) return '👑';
  if (level >= 30) return '⭐';
  if (level >= 20) return '🏆';
  if (level >= 10) return '🥇';
  if (level >= 5) return '🎯';
  return '🎮';
};

export const LevelBadge: React.FC<LevelBadgeProps> = ({ 
  level, 
  size = 'md', 
  showXP = false, 
  currentXP, 
  nextLevelXP 
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  return (
    <div className="flex items-center space-x-2">
      <Badge className={`${getLevelColor(level)} ${sizeClasses[size]} font-semibold border-0 shadow-lg`}>
        <span className="mr-1">{getLevelIcon(level)}</span>
        Level {level}
      </Badge>
      {showXP && currentXP !== undefined && nextLevelXP !== undefined && (
        <div className="text-xs text-slate-600 dark:text-slate-400">
          {currentXP}/{nextLevelXP} XP
        </div>
      )}
    </div>
  );
};
