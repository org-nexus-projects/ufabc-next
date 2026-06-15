import { isLocalHost } from '@/utils/runtimeConfig';

export const AUTHENTICATED_REDIRECT_PATH = '/reviews';
export const LANDING_PAGE_PATH = '/';
export const LOCAL_DEV_LOGIN_PATH = '/login';
export const SIGN_UP_PATH = '/signup';

export const shouldUseLocalLogin = (hostname: string) => isLocalHost(hostname);

export const getUnauthenticatedRedirectPath = (hostname: string) =>
  shouldUseLocalLogin(hostname) ? LOCAL_DEV_LOGIN_PATH : LANDING_PAGE_PATH;
