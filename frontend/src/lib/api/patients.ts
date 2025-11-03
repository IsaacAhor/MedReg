import axios from '@/lib/axios';

export interface PatientIdentifier {
  identifier: string;
  identifierType: {
    uuid: string;
    display: string;
  };
}

export interface Patient {
  uuid: string;
  display: string;
  identifiers: PatientIdentifier[];
  person: {
    uuid: string;
    gender: string;
    age: number;
    birthdate: string;
  };
}

export interface PatientListResponse {
  results: Patient[];
}

export interface PatientRegistrationData {
  ghanaCard: string;
  nhisNumber?: string;
  givenName: string;
  middleName?: string;
  familyName: string;
  gender: 'M' | 'F' | 'O';
  birthdate: string;
  phone: string;
  address: {
    city: string;
    district: string;
    region: string;
  };
}

export const patientsApi = {
  list: async (query?: string): Promise<PatientListResponse> => {
    const response = await axios.get('/patients', {
      params: query ? { q: query } : undefined,
    });
    return response.data;
  },

  getById: async (uuid: string): Promise<Patient> => {
    const response = await axios.get(`/patients/${uuid}`);
    return response.data;
  },

  register: async (data: PatientRegistrationData): Promise<Patient> => {
    const response = await axios.post('/patients', data);
    return response.data;
  },
};
