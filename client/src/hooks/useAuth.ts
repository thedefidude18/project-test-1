import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    onSuccess: (data) => {
      if (data) {
        setUser(data);
        // Invalidate balance query to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      }
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}