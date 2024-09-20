import { logger } from '@next/common';
import { ofetch } from 'ofetch';
import type { Token } from '@fastify/oauth2';
import type { LegacyGoogleUser } from './oauthTypes.js';
import type { User } from '@/models/User.js';

// Implement here the helpers for respective providers

export async function getGoogleUserDetails(
  token: Token,
): Promise<User['oauth']> {
  try {
    const user = await ofetch<LegacyGoogleUser>(
      'https://www.googleapis.com/plus/v1/people/me',
      {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      },
    );

    const email = user.emails[0].value;

    if (!user.id) {
      throw new Error('Missing Google id');
    }

    return {
      email: email,
      emailGoogle: email,
      google: user.id,
      emailFacebook: null,
      facebook: null,
      picture: null,
    };
  } catch (error) {
    logger.info({ error }, 'Error in google oauth');
    throw error;
  }
}

export async function getFacebookUserDetails(
  token: Token,
): Promise<User['oauth']> {
  // TODO: Do later with HTTPS
  const user = await ofetch('https://graph.facebook.com/v6.0/me', {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
    },
  });

  return {
    facebook: user.id,
    email: user.email,
    emailFacebook: user.email,
    emailGoogle: null,
    google: null,
  };
}
