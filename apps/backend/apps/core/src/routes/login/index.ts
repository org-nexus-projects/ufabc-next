import { type UserDocument, UserModel, type User } from '@/models/User.js';
import {
  createCardSchema,
  loginNotionSchema,
  type LegacyGoogleUser,
} from '@/schemas/login.js';
import type { Token } from '@fastify/oauth2';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import { Types, type FilterQuery } from 'mongoose';
import { ofetch } from 'ofetch';

export const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get('/google', async function (request, reply) {
    const validatedURI = await this.google.generateAuthorizationUri(
      request,
      reply,
    );
    const redirectURL = new URL(validatedURI);
    redirectURL.searchParams.append('prompt', 'select_account');

    app.log.warn(
      {
        url: redirectURL.hostname,
        query: redirectURL.search.split('&'),
        port: request.hostname,
      },
      '[OAUTH] start',
    );
    return reply.redirect(redirectURL.href);
  });

  app.get('/google/callback', async function (request, reply) {
    try {
      // @ts-ignore
      const userId = request.query.state;
      const { token } =
        await this.google.getAccessTokenFromAuthorizationCodeFlow(
          request,
          reply,
        );
      const oauthUser = await getUserDetails(token, request.log);
      const user = await createOrLogin(oauthUser, userId, request.log);
      request.log.info(
        {
          ufabcEmail: user.email,
          _id: user._id,
        },
        'user logged successfully',
      );
      const jwtToken = this.jwt.sign({
        _id: user._id,
        ra: user.ra,
        confirmed: user.confirmed,
        email: user.email,
        permissions: user.permissions,
      });

      const redirectURL = new URL('login', app.config.WEB_URL);

      redirectURL.searchParams.append('token', jwtToken);

      return reply.redirect(redirectURL.href);
    } catch (error: any) {
      if (error?.data?.payload) {
        reply.log.error(
          { originalError: error, error: error.data.payload },
          'Error in oauth2',
        );
        return error.data.payload;
      }

      // Unknwon (probably db) error
      request.log.error(error, 'deu merda severa');
      return reply.internalServerError(
        'Algo de errado aconteceu no seu login, tente novamente',
      );
    }
  });

  app.get('/notion', async function (request, reply) {
    const validatedURI = await this.notion.generateAuthorizationUri(
      request,
      reply,
    );
    app.log.info(validatedURI, 'generated notion URL');
    // Use URL constructor for better URL handling
    const redirectURL = new URL(validatedURI);
    if (!redirectURL) {
      return reply.internalServerError('Could not generate URL');
    }
    app.log.warn(
      {
        url: redirectURL.hostname,
        query: redirectURL.search.split('&'),
        port: request.hostname,
      },
      '[OAUTH] notion start',
    );
    return reply.redirect(validatedURI);
  });

  app.get(
    '/notion/callback',
    { schema: loginNotionSchema },
    async function (request, reply) {
      const { token } =
        await this.notion.getAccessTokenFromAuthorizationCodeFlow(
          request,
          reply,
        );

      return token;
    },
  );

  app.post(
    '/create-card',
    { schema: createCardSchema },
    async (request, reply) => {
      const { accessToken, email, ra, admissionYear, proofOfError } =
        request.body;

      if (!accessToken || !email || !ra || !admissionYear || !proofOfError) {
        return reply.badRequest('All fields are required.');
      }

      const notionPayload = {
        parent: { database_id: app.config.NOTION_DATABASE_ID },
        properties: {
          Email: { title: [{ text: { content: email } }] },
          RA: { number: ra },
          'Ano de Ingresso': { number: admissionYear },
          'Evidência do Erro': { url: proofOfError },
        },
      };

      const notionUrl = 'https://api.notion.com/v1';
      const notionPageUrl = new URL('/pages', notionUrl);

      const notionResponse = await postCardToNotion(
        notionPageUrl.href,
        notionPayload,
        accessToken,
      );

      return reply.send({
        message: 'Card created!',
        data: notionResponse,
      });
    },
  );
};

export default plugin;

async function postCardToNotion(
  notionUrl: string,
  notionPayload: object,
  token: string,
) {
  const headers = new Headers();
  headers.append('Authorization', `Bearer ${token}`);
  headers.append('Notion-Version', '2022-06-28');

  const notionResponse = await ofetch(notionUrl, {
    method: 'POST',
    body: notionPayload,
    headers,
  });

  return notionResponse;
}

async function getUserDetails(token: Token, logger: any) {
  const headers = new Headers();
  headers.append('Authorization', `Bearer ${token.access_token}`);

  const user = await ofetch<LegacyGoogleUser>(
    'https://www.googleapis.com/plus/v1/people/me',
    {
      headers,
    },
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
  logger: any,
) {
  try {
    const findUserQuery: FilterQuery<UserDocument>[] = [];

    if (oauthUser?.email) {
      findUserQuery.push({ email: oauthUser.email });
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
      user = new UserModel({
        active: true,
        oauth: {
          google: oauthUser?.google,
          emailGoogle: oauthUser?.emailGoogle,
          email: oauthUser?.email,
          facebook: oauthUser?.facebook,
          emailFacebook: oauthUser?.emailFacebook,
        },
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
