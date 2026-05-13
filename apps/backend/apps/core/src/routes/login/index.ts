import type { Token } from '@fastify/oauth2';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

import { Types, type QueryFilter as FilterQuery } from 'mongoose';
import { ofetch } from 'ofetch';

import { type UserDocument, UserModel, type User } from '@/models/User.js';
import { statePayloadType } from '@/plugins/external/oauth2.js';
import {
  googleCallbackSchema,
  type LegacyGoogleUser,
} from '@/schemas/login.js';

type RequestersUrls = {
  next: string;
  nextLocal: string;
  cronos: string;
};

export const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get(
    '/google',
    async function (request, reply) {
      const validatedURI = await this.google.generateAuthorizationUri(
        request,
        reply
      );
      const redirectURL = new URL(validatedURI);
      redirectURL.searchParams.append('prompt', 'select_account');

      app.log.debug(
        {
          url: redirectURL.hostname,
          query: redirectURL.search.split('&'),
          port: request.hostname,
        },
        '[OAUTH] start'
      );
      return reply.redirect(redirectURL.href);
    }
  );

  app.get(
    '/google/callback',
    { schema: googleCallbackSchema },
    async function (request, reply) {
      try {
        const { requesterKey, userId, redirectTarget } = JSON.parse(
          Buffer.from(request.query.state, 'base64url').toString()
        ) as statePayloadType;
        const { token } =
          await this.google.getAccessTokenFromAuthorizationCodeFlow(
            request,
            reply
          );
        const oauthUser = await getUserDetails(token, request.log);
        const user = await createOrLogin(oauthUser, userId, request.log);
        request.log.info(
          {
            email: user.email,
            _id: user._id,
          },
          'user logged successfully'
        );
        const jwtToken = this.jwt.sign({
          _id: user._id,
          ra: user.ra,
          confirmed: user.confirmed,
          email: user.email,
          permissions: user.permissions,
        });

        const DEFAULT_REQUESTERS_URLS: RequestersUrls = {
          next: app.config.WEB_URL,
          nextLocal: 'http://localhost:3000',
          cronos: app.config.CRONOS_URL,
        };

        const redirectURL = buildRedirectURL({
          requesterKey,
          redirectTarget,
          jwtToken,
          isUserConfirmed: user.confirmed,
          requestersUrls: DEFAULT_REQUESTERS_URLS,
        });

        return reply.redirect(redirectURL.href);
      } catch (error: any) {
        if (error?.data?.payload) {
          reply.log.error(
            { originalError: error, error: error.data.payload },
            'Error in oauth2'
          );
          return error.data.payload;
        }

        // Unknwon (probably db) error
        request.log.error(error, 'deu merda severa');
        return reply.internalServerError(
          'Algo de errado aconteceu no seu login, tente novamente'
        );
      }
    }
  );
};

async function getUserDetails(token: Token, logger: any) {
  const headers = new Headers();
  headers.append('Authorization', `Bearer ${token.access_token}`);

  const user = await ofetch<LegacyGoogleUser>(
    'https://www.googleapis.com/plus/v1/people/me',
    {
      headers,
    }
  );
  logger.info(user, {
    msg: 'Google User',
  });

  const email = user.emails[0].value;

  if (!user.id) {
    throw new Error('Missing GoogleId');
  }

  return {
    email,
    emailGoogle: email,
    google: user.id,
    emailFacebook: null,
    facebook: null,
    picture: null,
  };
}

async function createOrLogin(
  oauthUser: User['oauth'],
  userId: string,
  logger: any
) {
  try {
    const findUserQuery: FilterQuery<UserDocument>[] = [];

    if (oauthUser?.email) {
      findUserQuery.push({ email: oauthUser.email, confirmed: true });
    }

    if (oauthUser?.google) {
      findUserQuery.push({ 'oauth.google': oauthUser.google });
    }

    // Add user ID if provided and valid
    if (userId && userId !== 'undefined') {
      try {
        findUserQuery.push({ _id: new Types.ObjectId(userId) });
      } catch (error) {
        logger.warn('Invalid user ID provided', { userId });
      }
    }

    // Find existing user or create a new one
    let user =
      findUserQuery.length > 0
        ? await UserModel.findOne({ $or: findUserQuery })
        : null;

    // If no user found, create a new one
    if (!user) {
      const ttlHours = 1;
      const userExpireTime = Date.now() + ttlHours * 60 * 60 * 1000;
      const expiresAt = new Date(userExpireTime);
      user = new UserModel({
        active: true,
        oauth: {
          google: oauthUser?.google,
          emailGoogle: oauthUser?.emailGoogle,
          email: oauthUser?.email,
          facebook: oauthUser?.facebook,
          emailFacebook: oauthUser?.emailFacebook,
        },
        expiresAt,
      });
    } else {
      // Update existing user's OAuth information
      user.set({
        active: true,
        oauth: {
          ...user.oauth,
          google: user.oauth?.google || oauthUser?.google,
          emailGoogle: user.oauth?.emailGoogle || oauthUser?.emailGoogle,
          email: user.oauth?.email || oauthUser?.email,
          facebook: user.oauth?.facebook || oauthUser?.facebook,
          emailFacebook: user.oauth?.emailFacebook || oauthUser?.emailFacebook,
        },
      });
    }

    // Log user information
    logger.info({ user: user.toJSON(), msg: 'User before save' });

    // Save the user
    await user.save();

    // Return user data
    return user.toJSON();
  } catch (error) {
    logger.error({ error, oauthUser }, 'Error in createOrLogin');
    throw error;
  }
}

function buildRedirectURL({
  requesterKey,
  redirectTarget,
  jwtToken,
  isUserConfirmed,
  requestersUrls,
}: {
  requesterKey: 'ufabc-next' | 'ufabc-cronos';
    redirectTarget?: 'web' | 'web-local';
    jwtToken: string;
    isUserConfirmed: boolean;
    requestersUrls: RequestersUrls;
  }) {
  const { baseUrl, page, params } = requesterKey === 'ufabc-cronos'
    ? getUfabcCronosUrlDefaults({ jwtToken, isUserConfirmed, requestersUrls })
    : getUfabcNextUrlDefaults({ jwtToken, redirectTarget, requestersUrls });
  
  
  const redirectURL = new URL(page, baseUrl);

  for (const [key, value] of Object.entries(params))
    redirectURL.searchParams.append(key, String(value));

  return redirectURL;
}

function getUfabcCronosUrlDefaults({
  jwtToken,
  isUserConfirmed,
  requestersUrls,
}: {
  jwtToken: string;
  isUserConfirmed: boolean;
  requestersUrls: RequestersUrls;
  }) {
  if (isUserConfirmed) { 
    return {
      baseUrl: requestersUrls.cronos,
      page: '/',
      params: { token: jwtToken },
    }
  }
  
  // se o user tenta entrar no cronos mas nao tem conta no next, 
  // redireciona para o front do next com um aviso
  return {
    baseUrl: requestersUrls.next,
    page: 'signup',
    params: { advice: true },
  }
}

function getUfabcNextUrlDefaults({
  jwtToken,
  redirectTarget,
  requestersUrls,
}: {
  jwtToken: string;
  redirectTarget?: 'web' | 'web-local';
  requestersUrls: RequestersUrls;
  }) { 
  return {
    baseUrl: redirectTarget === 'web-local' ? requestersUrls.nextLocal : requestersUrls.next,
    page: 'login',
    params: { token: jwtToken },
  }
}

export default plugin;
