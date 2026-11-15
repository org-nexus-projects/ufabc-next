import type { User } from '@next/services';
import { jwtDecode } from 'jwt-decode';

export function parseJwt(token: string): {
  user: User | null;
  error: string | null;
} {
  try {
    return { error: null, user: jwtDecode<User>(token) };
  } catch {
    return { error: 'Invalid token format', user: null };
  }
}

export function isValidJwtFormat(token: string): boolean {
  return /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/u.test(token);
}

const TOKEN_EXPIRATION_SECONDS = 7 * 24 * 60 * 60;

export function isUserTokenExpired(user: User): boolean {
  const currentTime = Math.floor(Date.now() / 1000);
  const expirationTime = user.iat + TOKEN_EXPIRATION_SECONDS;
  return expirationTime < currentTime;
}
