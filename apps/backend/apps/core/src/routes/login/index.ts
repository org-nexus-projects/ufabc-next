import { UserModel, type User } from '@/models/User.js';
import type { LegacyGoogleUser } from '@/schemas/login.js';
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
      const findUserQuery: Record<string, unknown>[] = [];

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
            emailFacebook:
              user.oauth?.emailFacebook || oauthUser?.emailFacebook,
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
      logger.error('Error in createOrLogin', { error, oauthUser });
      throw error;
    }
  }
};
