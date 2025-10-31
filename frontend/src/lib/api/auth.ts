import axios from '@/lib/axios';

export type LoginPayload = { username: string; password: string };

export const authApi = {
  login: async (payload: LoginPayload) => {
    const res = await axios.post('/auth/login', payload);
    return res.data;
  },
  logout: async () => {
    const res = await axios.post('/auth/logout');
    return res.data;
  },
  session: async () => {
    const res = await axios.get('/auth/session');
    return res.data as { authenticated: boolean; user?: { username: string } };
  },
};

