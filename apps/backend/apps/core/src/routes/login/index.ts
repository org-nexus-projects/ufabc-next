import { UserModel, type User } from '@/models/User.js';
import {
  jobsLoginSchema,
  loginSchema,
  type LegacyGoogleUser,
} from '@/schemas/login.js';
import type { Token } from '@fastify/oauth2';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import { Types } from 'mongoose';
import { ofetch } from 'ofetch';

export const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get('/google', async function (request, reply) {
    const validatedURI = await this.google.generateAuthorizationUri(
      request,
      reply,
    );
    const redirectURL = new URL(validatedURI);
    app.log.warn(
      {
        url: redirectURL.hostname,
        query: redirectURL.search.split('&'),
        port: request.hostname,
      },
      '[OAUTH] start',
    );
    return reply.redirect(validatedURI);
  });

  app.get(
    '/google/callback',
    { schema: loginSchema },
    async function (request, reply) {
      try {
        const { userId } = request.query;
        const { token } =
          await this.google.getAccessTokenFromAuthorizationCodeFlow(
            request,
            reply,
          );
        const oauthUser = await getUserDetails(token);
        const user = await createOrLogin(oauthUser, userId);
        request.log.info(
          {
            ufabcEmail: user.email,
            _id: user._id,
          },
          'user logged successfully',
        );
        const jwtToken = this.jwt.sign(
          {
            _id: user._id,
            ra: user.ra,
            confirmed: user.confirmed,
            email: user.email,
            permissions: user.permissions,
          },
          { expiresIn: '7d' },
        );

        const redirectURL = new URL('login', app.config.WEB_URL);

        redirectURL.searchParams.append('token', jwtToken);

        return reply.redirect(redirectURL.href);
      } catch (error: any) {
        if (error?.data?.payload) {
          reply.log.error({ error: error.data.payload }, 'Error in oauth2');
          return error.data.payload;
        }

        // Unknwon (probably db) error
        request.log.warn(error, 'deu merda severa');
        return reply.internalServerError(
          'Algo de errado aconteceu no seu login, tente novamente',
        );
      }
    },
  );

  app.get(
    '/jobs-monitoring',
    { schema: jobsLoginSchema },
    async (request, reply) => {
      const { userId } = request.query;
      const user = await UserModel.findById(userId);

      if (!user) {
        request.log.warn({
          msg: 'Unregistered user',
          userId,
        });
        return reply.notFound('User not found');
      }

      if (!user.permissions.includes('admin')) {
        request.log.warn({
          msg: 'Unauthorized jobs request',
          userId,
          email: user.email,
        });
        return reply.unauthorized();
      }

      request.log.info({
        msg: 'Logging admin',
        userId,
      });
      const redirectURL = `${app.config.PROTOCOL}://${request.host}/board/ui`;

      return reply.redirect(redirectURL);
    },
  );
};

export default plugin;

async function getUserDetails(token: Token) {
  const headers = new Headers();
  headers.append('Authorization', `Bearer ${token.access_token}`);

  const user = await ofetch<LegacyGoogleUser>(
    'https://www.googleapis.com/plus/v1/people/me',
    {
      headers,
    },
  );

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

async function createOrLogin(oauthUser: User['oauth'], userId?: string) {
  const findUserQuery: Record<string, unknown>[] = [
    {
      'oauth.google': oauthUser?.google,
    },
  ];

  if (userId) {
    const [queryId] = userId.split('?');
    findUserQuery.push({ _id: new Types.ObjectId(queryId) });
  }

  const user =
    (await UserModel.findOne({ $or: findUserQuery })) || new UserModel();

  user.set({
    active: true,
    oauth: {
      google: oauthUser?.google,
      emailGoogle: oauthUser?.emailGoogle,
      email: oauthUser?.email,
    },
  });

  await user.save();

  return user.toJSON();
}
