import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/reports';

export function useOPDRegister(date: string, encounterTypeUuid?: string) {
  return useQuery({
    queryKey: ['reports', 'opd-register', date, encounterTypeUuid],
    queryFn: () => reportsApi.opdRegister(date, encounterTypeUuid),
    enabled: !!date,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useNHISvsCash(date: string) {
  return useQuery({
    queryKey: ['reports', 'nhis-vs-cash', date],
    queryFn: () => reportsApi.nhisVsCash(date),
    enabled: !!date,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useTopDiagnoses(from: string, to: string, limit: number = 10) {
  return useQuery({
    queryKey: ['reports', 'top-diagnoses', from, to, limit],
    queryFn: () => reportsApi.topDiagnoses(from, to, limit),
    enabled: !!from && !!to,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useRevenue(date: string) {
  return useQuery({
    queryKey: ['reports', 'revenue', date],
    queryFn: () => reportsApi.revenue(date),
    enabled: !!date,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
