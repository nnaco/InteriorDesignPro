import { User } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';

export function useAuth() {
  const authEndpoint = '/api/auth/user';

  const { data: user, isLoading } = useQuery<User>({
    queryKey: [authEndpoint],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
