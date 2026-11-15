import { isLocalHost } from '@/utils/runtimeConfig';

export const AUTHENTICATED_REDIRECT_PATH = '/reviews';
export const LANDING_PAGE_PATH = '/';
export const LOCAL_DEV_LOGIN_PATH = '/login';
export const SIGN_UP_PATH = '/signup';

export function shouldUseLocalLogin(hostname: string) {
  return isLocalHost(hostname);
}

export function getUnauthenticatedRedirectPath(hostname: string) {
  return shouldUseLocalLogin(hostname)
    ? LOCAL_DEV_LOGIN_PATH
    : LANDING_PAGE_PATH;
}
