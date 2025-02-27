import { UserModel, type User } from '@/models/User.js';
import {
  createCardSchema,
  jobsLoginSchema,
  loginSchema,
  notionSchema,
  type LegacyGoogleUser,
} from '@/schemas/login.js';
import type { Token } from '@fastify/oauth2';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import { Types } from 'mongoose';
import { ofetch } from 'ofetch';

export const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get('/google', async function(request, reply) {
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
    async function(request, reply) {
      try {
        const userId = request.query.state;
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
      const redirectURL = new URL(
        app.config.BOARD_PATH ?? '',
        `${app.config.PROTOCOL}://${request.host}`,
      );
      return reply.redirect(redirectURL.href);
    },
  );

  app.get('notion', async (request, reply) => {
    const notionUrl = 'https://api.notion.com/v1';
    const notionOauthUrl = new URL('/oauth/authorize', notionUrl);

    notionOauthUrl.searchParams.set('client_id', app.config.NOTION_CLIENT_ID);
    notionOauthUrl.searchParams.set('response_type', 'code');
    notionOauthUrl.searchParams.set('owner', 'user');
    notionOauthUrl.searchParams.set(
      'redirect_uri',
      encodeURIComponent(
        `${app.config.PROTOCOL}://${request.host}/login/notion/callback`,
      ),
    );

    request.log.info({
      obj: notionOauthUrl.href,
      msg: 'redirecting notion oauth',
    });

    reply.redirect(notionOauthUrl.href);
  });

  app.get(
    '/notion/callback',
    { schema: notionSchema },
    async (request, reply) => {
      const { code } = request.query;

      if (!code) {
        return reply.badRequest('Authorization code missing');
      }

      const notionRedirectUri = `${app.config.PROTOCOL}://${request.host}/login/notion/callback`;

      const { NOTION_CLIENT_ID, NOTION_CLIENT_SECRET } = app.config;

      const response = await getNotionTokenResponse(
        code,
        notionRedirectUri,
        NOTION_CLIENT_ID,
        NOTION_CLIENT_SECRET,
      );

      request.log.info({
        obj: response,
        msg: 'notion token response',
      });

      return reply.send({
        message: 'OAuth successful',
        access_token: response.access_token,
      });
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

async function getNotionTokenResponse(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
) {
  const notionUrl = 'https://api.notion.com/v1';
  const notionTokenUrl = new URL('/oauth/token', notionUrl);
  const headers = new Headers();

  headers.append('grant_type', 'authorization_code');
  headers.append('code', code);
  headers.append('redirect_uri', redirectUri);
  headers.append('client_id', clientId);
  headers.append('client_secret', clientSecret);

  const response = await ofetch(notionTokenUrl.href, {
    headers,
  });

  return response;
}

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

async function createOrLogin(oauthUser: User['oauth'], userId: string) {
  const findUserQuery: Record<string, unknown>[] = [
    {
      'oauth.google': oauthUser?.google,
    },
  ];

  if (userId !== 'undefined') {
    findUserQuery.push({ _id: new Types.ObjectId(userId) });
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
