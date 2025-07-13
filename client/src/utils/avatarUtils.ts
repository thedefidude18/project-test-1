
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

export const getAvatarUrl = (userId: string, userAvatar?: string, userName?: string) => {
  // Always return generated avatar for consistency
  return generateAvatar(userId || userName || 'default', 'avataaars');
};
