import axios from 'axios';
import { authStore } from 'stores';

const resolveEndpoint = (env?: string) =>
  ({
    development: 'http://localhost:5000/v2',
    staging: 'https://api.v2.ufabcnext.com/v2',
    production: 'https://api.ufabcnext.com/v1',
  })[env!] || 'https://api.v2.ufabcnext.com/v2';

export const api = axios.create({
  baseURL: resolveEndpoint(process.env.VUE_APP_MF_ENV),
});

api.interceptors.request.use(async (config) => {
  const { token } = authStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
