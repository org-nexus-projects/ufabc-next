import axios from 'axios';
import { authStore } from 'stores';

const resolveEndpoint = (env?: string) =>
  ({
    development: 'http://localhost:8011/v1',
    staging: 'https://api.ufabcnext.com/v1',
    production: 'https://api.ufabcnext.com/v1',
  })[env!] || 'https://api.ufabcnext.com/v1';

export const api = axios.create({
  baseURL: "https://api.ufabcnext.com/v1",
});

api.interceptors.request.use(async (config) => {
  const { token } = authStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
