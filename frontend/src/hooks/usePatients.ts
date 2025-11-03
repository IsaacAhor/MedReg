import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { patientsApi } from '@/lib/api/patients';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function usePatients(query?: string) {
  return useQuery({
    queryKey: ['patients', query],
    queryFn: () => patientsApi.list(query),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function usePatient(uuid: string) {
  return useQuery({
    queryKey: ['patients', uuid],
    queryFn: () => patientsApi.getById(uuid),
    enabled: !!uuid,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRegisterPatient() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patientsApi.register,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Patient registered successfully', {
        description: `${data.display} has been registered`,
      });
      router.push(`/patients/${data.uuid}`);
    },
    onError: (error: any) => {
      toast.error('Registration failed', {
        description: error.response?.data?.message || error.message || 'Failed to register patient',
      });
    },
  });
}
