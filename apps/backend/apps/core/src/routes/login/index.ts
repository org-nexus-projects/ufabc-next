import { UserModel, type User } from '@/models/User.js';
import {
  createCardSchema,
  loginNotionSchema,
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

async function getNotionUserDetails(token: Token) {
  const headers = new Headers();
  headers.append('Authorization', `Bearer ${token.access_token}`);
  headers.append('Notion-Version', '2022-06-28');

  const userData = await ofetch('https://api.notion.com/v1/users/me', {
    headers,
  });

  if (!userData.bot || !userData.bot.owner) {
    throw new Error('Missing Notion user data');
  }

  // Extract workspace info from bot owner
  const workspace = userData.bot.owner;

  return {
    notionId: userData.id,
    workspaceId: workspace.workspace_id || workspace.id,
    workspaceName: workspace.name,
    accessToken: token.access_token,
    workspaceIcon: workspace.icon,
    botId: userData.bot.id,
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
