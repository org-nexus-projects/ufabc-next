import { logger } from '@next/common';
import { ofetch } from 'ofetch';
import type { Token } from '@fastify/oauth2';
import type { GoogleUser, NextOAuth2User } from '@next/types';

// Implement here the helpers for respective providers

export async function getGoogleUserDetails(
  token: Token,
): Promise<NextOAuth2User> {
  try {
    const user = await ofetch<GoogleUser>(
      'https://people.googleapis.com/v1/people/me?personFields=emailAddresses',
      {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      },
    );
    const [userOauth] = user.emailAddresses.map(({ value, metadata }) => ({
      email: value,
      providerId: metadata.source.id,
    }));

    if (!userOauth?.providerId) {
      throw new Error('Missing Google id');
    }

    return {
      email: userOauth.email,
      providerId: userOauth.providerId,
      provider: 'google',
    };
  } catch (error) {
    logger.info({ error }, 'Error in google oauth');
    throw error;
  }
}

export async function getFacebookUserDetails(
  token: Token,
): Promise<NextOAuth2User> {
  // TODO: Do later with HTTPS
  const user = await ofetch(`https://graph.facebook.com/v6.0/me`, {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
    },
  });

  return {
    providerId: user.id,
    email: user.email,
    provider: 'facebook',
  };
}
