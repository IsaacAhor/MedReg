import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { VitalsFormData } from '@/lib/schemas/vitals';

export function useRecordVitals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: VitalsFormData) => {
      const response = await api.post('/triage/vitals', data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vitals', variables.patientUuid] });
      toast.success('Vitals recorded successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to record vitals';
      toast.error(message);
    },
  });
}

export function usePatientVitals(patientUuid: string) {
  return useQuery({
    queryKey: ['vitals', patientUuid],
    queryFn: async () => {
      const response = await api.get(`/triage/vitals/${patientUuid}`);
      return response.data;
    },
    enabled: !!patientUuid,
  });
}
