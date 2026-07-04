import { createDecipheriv, createHash } from 'node:crypto';

import {
  matriculaTokenBodySchema,
  matriculaTokenResponseSchema,
  whatsappTokenBodySchema,
  whatsappTokenResponseSchema,
} from '@next/connectors/schemas/next-api';
import { currentQuad } from '@next/utils';
import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { matriculaSession } from '@/hooks/matricula-session.js';
import { ComponentModel } from '@/models/Component.js';
import { UserModel } from '@/models/User.js';

import { AuthenticationService } from '../services/authentication-service.js';

export const authenticationController: FastifyPluginAsyncZod = async (app) => {
  app.route({
    handler: async (request, reply) => {
      const { component, token } = request.body;

      let decryptedPayload: string;
      try {
        const components = JSON.parse(
          Buffer.from(token, 'base64').toString('utf-8')
        ) as {
          iv: string;
          data: string;
          tag: string;
        };

        const key = createHash('sha256').update(secret).digest();
        const decipher = createDecipheriv(
          'aes-256-gcm',
          key,
          Buffer.from(components.iv, 'base64')
        );

        decipher.setAuthTag(Buffer.from(components.tag, 'base64'));

        const decrypted = Buffer.concat([
          decipher.update(Buffer.from(components.data, 'base64')),
          decipher.final(),
        ]);

        const payload = JSON.parse(decrypted.toString('utf-8')) as {
          data: string;
          expiresAt?: number;
        };

        if (
          payload.expiresAt &&
          payload.expiresAt < Math.floor(Date.now() / 1000)
        ) {
          throw new Error('Token has expired');
        }

        decryptedPayload = payload.data;
      } catch (error) {
        request.log.warn({ error }, 'Failed to decrypt WhatsApp auth token');
        return await reply.unauthorized('Invalid or expired token');
      }

      const separatorIndex = decryptedPayload.indexOf('+');
      if (separatorIndex === -1) {
        return await reply.badRequest('Invalid token payload');
      }

      const ra = decryptedPayload.slice(0, separatorIndex);
      const email = decryptedPayload.slice(separatorIndex + 1);

      if (!ra || !email) {
        return await reply.badRequest('Invalid token payload');
      }

      const user = await UserModel.findOne({ email }).lean();
      if (!user) {
        return await reply.unauthorized('User not found');
      }

      if (user.ra && String(user.ra) !== ra) {
        return await reply.unauthorized('RA mismatch');
      }

      const season = currentQuad();
      const componentDoc = await ComponentModel.findOne({
        season,
        uf_cod_turma: component,
      }).lean();

      if (!componentDoc) {
        return await reply.badRequest('Component not found');
      }

      const jwtToken = app.jwt.sign({
        _id: user._id,
        confirmed: user.confirmed,
        email: user.email,
        permissions: user.permissions,
        ra: user.ra,
      });

      request.log.info(
        { ra: user.ra, userId: user._id },
        'WhatsApp auth token validated successfully'
      );

      return await reply.status(200).send({ token: jwtToken });
    },
    method: 'POST',
    schema: {
      body: whatsappTokenBodySchema,
      response: {
        200: whatsappTokenResponseSchema,
      },
    },
    url: '/auth/whatsapp-token',
  });

  app.route({
    handler: async (request, reply) => {
      const { login } = request.body;
      const season = currentQuad();
      const authenticationService = new AuthenticationService({
        globalTraceId: request.id,
        jwtService: app.jwt,
      });

      const token = await authenticationService.generateMatriculaToken(
        login,
        season
      );
      const response = { token };

      return await reply.status(200).send(response);
    },
    method: 'POST',
    preHandler: [matriculaSession],
    schema: { 
      body: matriculaTokenBodySchema,
      headers: z.object({
        'session-id': z.string(),
      }),
      response: {
        200: matriculaTokenResponseSchema,
      },
    },
    url: '/auth/matricula',
  });
};
