
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  challengeNotifications: boolean;
  eventNotifications: boolean;
  friendNotifications: boolean;
}

export const useNotificationSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<NotificationSettings>({
    queryKey: ['/api/notification-preferences'],
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: async (newSettings: Partial<NotificationSettings>) => {
      const response = await fetch('/api/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-preferences'] });
    },
  });

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    updateMutation.mutate({ [key]: value });
  };

  return {
    settings: settings || {
      emailNotifications: true,
      pushNotifications: true,
      challengeNotifications: true,
      eventNotifications: true,
      friendNotifications: true,
    },
    isLoading,
    updateSetting,
    isUpdating: updateMutation.isPending,
  };
};
