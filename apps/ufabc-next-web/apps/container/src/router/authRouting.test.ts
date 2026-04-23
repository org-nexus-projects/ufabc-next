import {
  AUTHENTICATED_REDIRECT_PATH,
  getUnauthenticatedRedirectPath,
  LANDING_PAGE_PATH,
  LOCAL_DEV_LOGIN_PATH,
  shouldUseLocalLogin,
  SIGN_UP_PATH,
} from './authRouting';

describe('authRouting', () => {
  test('keeps local login enabled for localhost sessions', () => {
    expect(shouldUseLocalLogin('localhost')).toBe(true);
    expect(shouldUseLocalLogin('127.0.0.1')).toBe(true);
  });

  test('disables local login outside localhost sessions', () => {
    expect(shouldUseLocalLogin('ufabcnext.com')).toBe(false);
  });

  test('redirects unauthenticated local sessions to /login', () => {
    expect(getUnauthenticatedRedirectPath('localhost')).toBe(
      LOCAL_DEV_LOGIN_PATH,
    );
  });

  test('redirects unauthenticated deployed sessions to landing page', () => {
    expect(getUnauthenticatedRedirectPath('ufabcnext.com')).toBe(
      LANDING_PAGE_PATH,
    );
  });

  test('keeps route constants stable for auth navigation', () => {
    expect(AUTHENTICATED_REDIRECT_PATH).toBe('/reviews');
    expect(SIGN_UP_PATH).toBe('/signup');
  });
});
