import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, type SessionData } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useSession() {
  return useQuery<SessionData>({
    queryKey: ['session'],
    queryFn: authApi.getSession,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      queryClient.setQueryData(['session'], data);
      toast.success('Login successful', {
        description: `Welcome back, ${data.user?.display}`,
      });
      router.push('/dashboard');
    },
    onError: (error: any) => {
      const isTimeout = error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '');
      const desc = isTimeout
        ? 'Backend not reachable. Ensure OpenMRS is running at 8080.'
        : (error.response?.data?.message || error.message || 'Authentication failed');
      toast.error('Login failed', { description: desc });
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      toast.success('Logged out', {
        description: 'You have been successfully logged out',
      });
      router.push('/login');
    },
    onError: (error: any) => {
      toast.error('Logout failed', {
        description: error.message,
      });
    },
  });
}
