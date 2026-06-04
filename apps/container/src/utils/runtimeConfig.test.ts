import {
  buildGoogleAuthUrl,
  isLocalAppSession,
  isLocalHost,
  isRemoteApiSession,
  runtimeConfig,
} from './runtimeConfig';

describe('runtimeConfig', () => {
  test('detects local hostnames', () => {
    expect(isLocalHost('localhost')).toBe(true);
    expect(isLocalHost('127.0.0.1')).toBe(true);
    expect(isLocalHost('ufabcnext.com')).toBe(false);
  });

  test('detects local app sessions', () => {
    expect(isLocalAppSession('localhost')).toBe(true);
    expect(isLocalAppSession('127.0.0.1')).toBe(true);
    expect(isLocalAppSession('app.ufabcnext.com')).toBe(false);
  });

  test('detects remote api sessions', () => {
    expect(isRemoteApiSession('http://localhost:5000')).toBe(false);
    expect(isRemoteApiSession('https://api.ufabcnext.com')).toBe(true);
  });

  test('builds google login url from api base url', () => {
    expect(buildGoogleAuthUrl({ requesterKey: 'ufabc-next' })).toBe(
      `${runtimeConfig.apiBaseUrl}/login/google?requesterKey=ufabc-next`,
    );
  });

  test('adds redirect target when app is local and api is remote', () => {
    expect(
      buildGoogleAuthUrl({
        requesterKey: 'ufabc-next',
        appHostname: 'localhost',
        apiBaseUrl: 'https://api.ufabcnext.com',
      }),
    ).toBe(
      'https://api.ufabcnext.com/login/google?requesterKey=ufabc-next&redirectTarget=web-local',
    );
  });

  test('builds google account association url', () => {
    expect(buildGoogleAuthUrl({ userId: 'user-123' })).toBe(
      `${runtimeConfig.apiBaseUrl}/login/google?userId=user-123`,
    );
  });
});
