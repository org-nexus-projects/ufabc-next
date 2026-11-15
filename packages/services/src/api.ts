/// <reference types="vite/client" />

import { create } from 'axios';

function getRequiredEnv(key: 'VITE_API_BASE_URL' | 'VITE_PARSER_API_BASE_URL') {
  const value = import.meta.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

let getToken: () => string | null = () => null;
export function setTokenGetter(fn: () => string | null) {
  getToken = fn;
}

export const api = create({
  baseURL: getRequiredEnv('VITE_API_BASE_URL'),
});

export const apiParser = create({
  baseURL: getRequiredEnv('VITE_PARSER_API_BASE_URL'),
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token !== null && token !== '') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
