type RequiredEnvKey =
  | 'VITE_APP_ENV'
  | 'VITE_APP_BASE_URL'
  | 'VITE_API_BASE_URL'
  | 'VITE_PARSER_API_BASE_URL';

type GoogleAuthUrlOptions = {
  requesterKey?: string;
  userId?: string;
  appHostname?: string;
  apiBaseUrl?: string;
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

export const isRemoteApiSession = (apiBaseUrl = runtimeConfig.apiBaseUrl) => {
  const apiHostname = new URL(apiBaseUrl).hostname;
  return !isLocalHost(apiHostname);
};

export const buildGoogleAuthUrl = ({
  requesterKey,
  userId,
  appHostname = window.location.hostname,
  apiBaseUrl = runtimeConfig.apiBaseUrl,
}: GoogleAuthUrlOptions = {}) => {
  const url = new URL('login/google', normalizeBaseUrl(apiBaseUrl));

  if (requesterKey) {
    url.searchParams.set('requesterKey', requesterKey);
  }

  if (userId) {
    url.searchParams.set('userId', userId);
  }

  if (
    requesterKey === 'ufabc-next' &&
    isLocalAppSession(appHostname) &&
    isRemoteApiSession(apiBaseUrl)
  ) {
    url.searchParams.set('redirectTarget', 'web-local');
  }

  return url.toString();
};
