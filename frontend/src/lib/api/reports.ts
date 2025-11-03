import axios from '@/lib/axios';

export interface OPDRegisterEntry {
  patientName: string;
  ghanaCard: string;
  age: number;
  gender: string;
  diagnosis: string;
  encounterDate: string;
}

export interface NHISvsCashSummary {
  totalPatients: number;
  nhisPatients: number;
  cashPatients: number;
  nhisRevenue: number;
  cashRevenue: number;
}

export interface TopDiagnosis {
  diagnosis: string;
  count: number;
}

export interface RevenueSummary {
  totalRevenue: number;
  cashCollected: number;
  nhisPending: number;
  date: string;
}

export const reportsApi = {
  opdRegister: async (date: string, encounterTypeUuid?: string): Promise<OPDRegisterEntry[]> => {
    const response = await axios.get('/reports/opd-register', {
      params: { date, encounterTypeUuid },
    });
    return response.data;
  },

  nhisVsCash: async (date: string): Promise<NHISvsCashSummary> => {
    const response = await axios.get('/reports/nhis-vs-cash', {
      params: { date },
    });
    return response.data;
  },

  topDiagnoses: async (from: string, to: string, limit: number = 10): Promise<TopDiagnosis[]> => {
    const response = await axios.get('/reports/top-diagnoses', {
      params: { from, to, limit },
    });
    return response.data;
  },

  revenue: async (date: string): Promise<RevenueSummary> => {
    const response = await axios.get('/reports/revenue', {
      params: { date },
    });
    return response.data;
  },
};
