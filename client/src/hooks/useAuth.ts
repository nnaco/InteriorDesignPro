import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // Use dev auth endpoint in development mode
  const authEndpoint = import.meta.env.DEV ? "/api/auth/user-dev" : "/api/auth/user";
  
  const { data: user, isLoading } = useQuery({
    queryKey: [authEndpoint],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
