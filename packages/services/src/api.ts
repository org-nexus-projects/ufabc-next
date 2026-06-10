import axios from 'axios';

const getRequiredEnv = (
  key: 'VITE_API_BASE_URL' | 'VITE_PARSER_API_BASE_URL',
) => {
  const value = import.meta.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

let getToken: () => string | null = () => null;
export const setTokenGetter = (fn: () => string | null) => {
  getToken = fn;
};

export const api = axios.create({
  baseURL: getRequiredEnv('VITE_API_BASE_URL'),
});

export const apiParser = axios.create({
  baseURL: getRequiredEnv('VITE_PARSER_API_BASE_URL'),
});

export const apiCommunications = axios.create({
  baseURL: 'https://communications.fundacaonexus.com/v2',
});

api.interceptors.request.use(async (config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
