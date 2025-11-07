import { useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import type { ConsultationFormData } from '@/lib/schemas/consultation';

export function useConsultation() {
  return useMutation({
    mutationFn: async (data: ConsultationFormData) => {
      const res = await api.post('/opd/consultation', data);
      return res.data as { ok?: boolean; encounterUuid?: string; error?: string };
    },
    onSuccess: (data) => {
      if (data?.ok) {
        toast.success('Consultation saved');
      } else {
        toast.error(data?.error || 'Failed to save consultation');
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to save consultation';
      toast.error(message);
    },
  });
}
