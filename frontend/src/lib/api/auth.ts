import axios from '@/lib/axios';

export interface LoginCredentials {
  username: string;
  password: string;
  location: string;
}

export interface SessionData {
  authenticated: boolean;
  user?: {
    uuid: string;
    display: string;
    username: string;
  };
  sessionLocation?: {
    uuid: string;
    display: string;
  };
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<SessionData> => {
    const response = await axios.post('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await axios.post('/auth/logout');
  },

  getSession: async (): Promise<SessionData> => {
    const response = await axios.get('/auth/session');
    return response.data;
  },
};

