import axios from 'axios';

export interface OpenMRSRestConfig {
  baseUrl: string;
  username: string;
  password: string;
}

export async function getModules(cfg: OpenMRSRestConfig) {
  const resp = await axios.get(`${cfg.baseUrl}/module`, {
    auth: { username: cfg.username, password: cfg.password },
    params: { v: 'full' },
    timeout: 30000,
  });
  return resp.data;
}

