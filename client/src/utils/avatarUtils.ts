import { createAvatar } from '@dicebear/core';
import { avataaars, initials, personas } from '@dicebear/collection';

export const generateAvatar = (seed: string, style: 'avataaars' | 'initials' | 'personas' = 'avataaars') => {
  const collections = {
    avataaars,
    initials,
    personas
  };

  const avatar = createAvatar(collections[style], {
    seed,
    size: 128,
    backgroundColor: ['7440FF', 'FFE066', 'FF6B6B', '4ECDC4', '95E1D3'],
  });

  return avatar.toString();
};

export function getAvatarUrl(userId: string, username?: string): string {
  const seed = userId || username || 'default';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=7440ff&scale=85`;
}