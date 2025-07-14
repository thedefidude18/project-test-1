import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useEffect, useState } from 'react';

export function useDailySignIn() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  // Fetch daily sign-in status
  const { data: signInStatus, isLoading } = useQuery({
    queryKey: ['/api/daily-signin/status'],
    queryFn: () => apiRequest('GET', '/api/daily-signin/status'),
    enabled: !!user,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Claim daily sign-in mutation
  const claimMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/daily-signin/claim'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/daily-signin/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
    },
  });

  // Show modal when appropriate
  useEffect(() => {
    if (signInStatus?.showModal && !showModal) {
      setShowModal(true);
    }
  }, [signInStatus?.showModal, showModal]);

  return {
    signInStatus,
    isLoading,
    showModal,
    setShowModal,
    claimBonus: claimMutation.mutate,
    isClaiming: claimMutation.isPending,
  };
}