import JwtAuth from './plugins/jwt.js';
import Oauth2 from './plugins/oauth2/oauth2.js';
import { Config } from './config/config.js';
import type { FastifyInstance } from 'fastify';

export async function loadPlugins(app: FastifyInstance) {
  await Promise.all([
    app.register(JwtAuth, {
      secret: Config.JWT_SECRET,
    }),
    app.register(Oauth2, {
      googleId: Config.OAUTH_GOOGLE_CLIENT_ID,
      googleSecret: Config.OAUTH_GOOGLE_SECRET,
      facebookId: '',
      facebookSecret: '',
    }),
  ]);
}
