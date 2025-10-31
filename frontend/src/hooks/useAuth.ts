"use client";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, type LoginPayload } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';

export function useSession() {
  return useQuery({ queryKey: ['session'], queryFn: authApi.session, staleTime: 60_000 });
}

export function useLogin() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session'] });
      router.push('/');
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session'] });
      router.push('/login');
    },
  });
}

