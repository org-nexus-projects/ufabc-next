import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { currentQuad } from '@next/common';
import { createDecipheriv, createHash } from 'node:crypto';
import { z } from 'zod';

import { ComponentModel } from '@/models/Component.js';
import { UserModel } from '@/models/User.js';

export const authenticationController: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'POST',
    url: '/auth/whatsapp-token',
    schema: {
      body: z.object({
        component: z.string().min(1),
        token: z.string().min(1),
      }),
      response: {
        200: z.object({
          token: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { component, token } = request.body;

      let decryptedPayload: string;
      try {
        const secret = app.config.WHATSAPP_AUTH_SECRET;
        if (!secret) {
          throw new Error('WHATSAPP_AUTH_SECRET is not configured');
        }

        const components = JSON.parse(
          Buffer.from(token, 'base64').toString('utf8'),
        ) as {
          iv: string;
          data: string;
          tag: string;
        };

        const key = createHash('sha256').update(secret).digest();
        const decipher = createDecipheriv(
          'aes-256-gcm',
          key,
          Buffer.from(components.iv, 'base64'),
        );

        decipher.setAuthTag(Buffer.from(components.tag, 'base64'));

        const decrypted = Buffer.concat([
          decipher.update(Buffer.from(components.data, 'base64')),
          decipher.final(),
        ]);

        const payload = JSON.parse(decrypted.toString('utf8')) as {
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
        return reply.unauthorized('Invalid or expired token');
      }

      const separatorIndex = decryptedPayload.indexOf('+');
      if (separatorIndex === -1) {
        return reply.badRequest('Invalid token payload');
      }

      const ra = decryptedPayload.slice(0, separatorIndex);
      const email = decryptedPayload.slice(separatorIndex + 1);

      if (!ra || !email) {
        return reply.badRequest('Invalid token payload');
      }

      const user = await UserModel.findOne({ email }).lean();
      if (!user) {
        return reply.unauthorized('User not found');
      }

      if (user.ra && String(user.ra) !== ra) {
        return reply.unauthorized('RA mismatch');
      }

      const season = currentQuad();
      const componentDoc = await ComponentModel.findOne({
        codigo: component,
        season,
      }).lean();

      if (!componentDoc) {
        return reply.badRequest('Component not found');
      }

      const jwtToken = app.jwt.sign({
        _id: user._id,
        ra: user.ra,
        confirmed: user.confirmed,
        email: user.email,
        permissions: user.permissions,
      });

      request.log.info(
        { userId: user._id, ra: user.ra },
        'WhatsApp auth token validated successfully',
      );

      return reply.status(200).send({ token: jwtToken });
    },
  });
};
