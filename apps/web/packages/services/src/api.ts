import axios from 'axios';
import { authStore } from 'stores';

export const api = axios.create({ baseURL: 'https://api.ufabcnext.com/v1/' });

api.interceptors.request.use(async (config) => {
  const { token } = authStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
