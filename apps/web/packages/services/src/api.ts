import axios from 'axios';

const resolveEndpoint = (env?: string) =>
  ({
    development: 'http://localhost:5000',
    staging: 'https://api.v2.ufabcnext.com',
    production: 'https://api.v2.ufabcnext.com',
  })[env!] || 'https://api.v2.ufabcnext.com';

let getToken: () => string | null = () => null;
export const setTokenGetter = (fn: () => string | null) => {
  getToken = fn;
};

export const api = axios.create({
  baseURL: resolveEndpoint(import.meta.env.VITE_APP_ENV),
});

api.interceptors.request.use(async (config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
