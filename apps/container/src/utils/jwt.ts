import { User } from '@ufabc-next/types';
import { jwtDecode } from 'jwt-decode';

export function parseJwt(token: string): {
  user: User | null;
  error: string | null;
} {
  try {
    return { user: jwtDecode<User>(token), error: null };
  } catch {
    return { user: null, error: 'Invalid token format' };
  }
}

export function isValidJwtFormat(token: string): boolean {
  return /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/.test(token);
}

const TOKEN_EXPIRATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

export function isUserTokenExpired(user: User): boolean {
  const currentTime = Math.floor(Date.now() / 1000);
  const expirationTime = user.iat + TOKEN_EXPIRATION_SECONDS;
  return expirationTime < currentTime;
}
