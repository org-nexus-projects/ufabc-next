import type { OAuth2Namespace, Token } from '@fastify/oauth2';
import type {
  FastifyBaseLogger,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';

import { httpErrors } from '@fastify/sensible';
import { Types, type QueryFilter as FilterQuery } from 'mongoose';
import { ofetch } from 'ofetch';

import { type UserDocument, UserModel, type User } from '@/models/User.js';
import type { statePayloadType } from '@/plugins/external/oauth2.js';
import type { LegacyGoogleUser } from '@/schemas/login.js';

type RequesterUrls = {
  next: string;
  nextLocal: string;
  cronos: string;
};

type GoogleLoginDependencies = {
  config: FastifyInstance['config'];
  google: OAuth2Namespace;
  jwt: Pick<FastifyInstance['jwt'], 'sign'>;
};

type ProviderError = {
  data?: {
    payload?: unknown;
    res?: { statusCode?: number };
  };
};

export async function buildGoogleAuthorizationUrl(
  google: OAuth2Namespace,
  request: FastifyRequest,
  reply: FastifyReply,
  logger: FastifyBaseLogger
) {
  const validatedURI = await google.generateAuthorizationUri(request, reply);
  const redirectURL = new URL(validatedURI);
  redirectURL.searchParams.append('prompt', 'select_account');
  redirectURL.searchParams.append('hd', 'ufabc.edu.br');

  logger.debug(
    {
      url: redirectURL.hostname,
      query: redirectURL.search.split('&'),
      port: request.hostname,
    },
    '[OAUTH] start'
  );

  return redirectURL.href;
}

export async function completeGoogleLogin(
  dependencies: GoogleLoginDependencies,
  request: FastifyRequest,
  reply: FastifyReply
) {
  let loginFailure: Error;

  try {
    const { state } = request.query as { state: string };
    const { requesterKey, userId, redirectTarget } = JSON.parse(
      Buffer.from(state, 'base64url').toString()
    ) as statePayloadType;
    const { token } =
      await dependencies.google.getAccessTokenFromAuthorizationCodeFlow(
        request,
        reply
      );
    const oauthUser = await getUserDetails(token, request.log);

    const BYPASS_EMAILS = ['nexusterceiros@gmail.com'];
    if (
      !oauthUser.email.endsWith('ufabc.edu.br') &&
      !BYPASS_EMAILS.includes(oauthUser.email)
    ) {
      loginFailure = httpErrors.forbidden(
        'Apenas e-mails com ufabc.edu.br são permitidos'
      );
    } else {
      const user = await createOrLogin(oauthUser, userId, request.log);
      request.log.info(
        {
          email: user.email,
          _id: user._id,
        },
        'user logged successfully'
      );
      const jwtToken = dependencies.jwt.sign({
        _id: user._id,
        ra: user.ra,
        confirmed: user.confirmed,
        email: user.email,
        permissions: user.permissions,
      });

      const requesterUrls: RequesterUrls = {
        next: dependencies.config.WEB_URL,
        nextLocal: 'http://localhost:3000',
        cronos: dependencies.config.CRONOS_URL,
      };

      const redirectURL = buildRedirectURL({
        requesterKey,
        redirectTarget,
        jwtToken,
        isUserConfirmed: user.confirmed,
        requesterUrls,
      });

      return reply.redirect(redirectURL.href);
    }
  } catch (error: unknown) {
    const providerError = getProviderError(error);

    if (providerError) {
      reply.log.error(
        {
          error: providerError.payload,
          statusCode: providerError.statusCode,
        },
        'Error in oauth2'
      );
      return providerError.payload;
    }

    // Unknwon (probably db) error
    request.log.error({ error }, 'deu merda severa');
    loginFailure = httpErrors.internalServerError(
      'Algo de errado aconteceu no seu login, tente novamente'
    );
  }

  throw loginFailure;
}

function getProviderError(error: unknown) {
  if (typeof error !== 'object' || error === null || !('data' in error)) {
    return null;
  }

  const { data } = error as ProviderError;

  if (!data?.payload) {
    return null;
  }

  return { payload: data.payload, statusCode: data.res?.statusCode };
}

async function getUserDetails(token: Token, logger: FastifyBaseLogger) {
  const headers = new Headers();
  headers.append('Authorization', `Bearer ${token.access_token}`);

  const user = await ofetch<LegacyGoogleUser>(
    'https://www.googleapis.com/plus/v1/people/me',
    {
      headers,
    }
  );
  logger.info(user, 'Google User');

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
  logger: FastifyBaseLogger
) {
  try {
    const findUserQuery: FilterQuery<UserDocument>[] = [];

    if (oauthUser?.email) {
      findUserQuery.push({ email: oauthUser.email, confirmed: true });
    }

    // Add user ID if provided and valid
    if (userId && userId !== 'undefined') {
      try {
        findUserQuery.push({ _id: new Types.ObjectId(userId) });
      } catch (error) {
        logger.warn({ userId }, 'Invalid user ID provided');
      }
    }

    // Find existing user or create a new one
    let user =
      findUserQuery.length > 0
        ? await UserModel.findOne({ $or: findUserQuery })
        : null;

    if (!user && oauthUser?.email) {
      const login = oauthUser.email.split('@')[0];
      user = await UserModel.findOne({
        email: new RegExp(`^${login}@aluno\\.ufabc\\.edu\\.br$`, 'i'),
        confirmed: true,
      });
    }

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
  requesterUrls,
}: {
  requesterKey: 'ufabc-next' | 'ufabc-cronos';
  redirectTarget?: 'web' | 'web-local';
  jwtToken: string;
  isUserConfirmed: boolean;
  requesterUrls: RequesterUrls;
}) {
  const { baseUrl, path, params } =
    requesterKey === 'ufabc-cronos'
      ? getUfabcCronosRedirect({ jwtToken, isUserConfirmed, requesterUrls })
      : getUfabcNextRedirect({ jwtToken, redirectTarget, requesterUrls });

  const redirectURL = new URL(path, baseUrl);

  for (const [key, value] of Object.entries(params)) {
    redirectURL.searchParams.set(key, value);
  }

  return redirectURL;
}

function getUfabcCronosRedirect({
  jwtToken,
  isUserConfirmed,
  requesterUrls,
}: {
  jwtToken: string;
  isUserConfirmed: boolean;
  requesterUrls: RequesterUrls;
}) {
  if (isUserConfirmed) {
    return {
      baseUrl: requesterUrls.cronos,
      path: '/',
      params: { token: jwtToken },
    };
  }

  // If a user logs in through Cronos without a UFABC Next account,
  // redirect to UFABC Next signup with an advisory message.
  return {
    baseUrl: requesterUrls.next,
    path: '/signup',
    params: { advice: 'true' },
  };
}

function getUfabcNextRedirect({
  jwtToken,
  redirectTarget,
  requesterUrls,
}: {
  jwtToken: string;
  redirectTarget?: 'web' | 'web-local';
  requesterUrls: RequesterUrls;
}) {
  return {
    baseUrl:
      redirectTarget === 'web-local'
        ? requesterUrls.nextLocal
        : requesterUrls.next,
    path: '/login',
    params: { token: jwtToken },
  };
}
