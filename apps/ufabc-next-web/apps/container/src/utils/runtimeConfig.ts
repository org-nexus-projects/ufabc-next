type RequiredEnvKey =
  | 'VITE_APP_ENV'
  | 'VITE_APP_BASE_URL'
  | 'VITE_API_BASE_URL'
  | 'VITE_PARSER_API_BASE_URL';

type GoogleLoginUrlOptions = {
  requesterKey?: string;
  userId?: string;
};

const getRequiredEnv = <TKey extends RequiredEnvKey>(key: TKey) => {
  const value = import.meta.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value as ImportMetaEnv[TKey];
};

const normalizeBaseUrl = (baseUrl: string) =>
  baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

export const runtimeConfig = {
  appEnv: getRequiredEnv('VITE_APP_ENV'),
  appBaseUrl: getRequiredEnv('VITE_APP_BASE_URL'),
  apiBaseUrl: getRequiredEnv('VITE_API_BASE_URL'),
  parserApiBaseUrl: getRequiredEnv('VITE_PARSER_API_BASE_URL'),
};

export const isLocalHost = (hostname: string) =>
  hostname === 'localhost' || hostname === '127.0.0.1';

export const isLocalAppSession = (hostname = window.location.hostname) =>
  isLocalHost(hostname);

export const buildGoogleLoginUrl = ({
  requesterKey,
  userId,
}: GoogleLoginUrlOptions = {}) => {
  const url = new URL(
    'login/google',
    normalizeBaseUrl(runtimeConfig.apiBaseUrl),
  );

  if (requesterKey) {
    url.searchParams.set('requesterKey', requesterKey);
  }

  if (userId) {
    url.searchParams.set('userId', userId);
  }

  return url.toString();
};
