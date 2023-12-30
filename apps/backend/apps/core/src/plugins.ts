import Cors from './plugins/cors.js';
import Mongoose from './plugins/mongoose.js';
import Redis from './plugins/redis.js';
import JwtAuth from './plugins/jwt.js';
import Oauth2 from './plugins/oauth2/oauth2.js';
import Swagger from './plugins/swagger.js';
import { Config } from './config/config.js';
import type { FastifyInstance } from 'fastify';

export async function loadPlugins(app: FastifyInstance) {
  await Promise.all([
    app.register(Cors),
    app.register(Mongoose, {
      connectionUrl: Config.MONGODB_CONNECTION_URL,
    }),
    app.register(Redis, {
      username: Config.REDIS_USER,
      password: Config.REDIS_PASSWORD,
      host: Config.REDIS_HOST,
      port: Config.REDIS_PORT,
    }),
    app.register(JwtAuth, {
      secret: Config.JWT_SECRET,
    }),
    app.register(Oauth2, {
      googleId: Config.OAUTH_GOOGLE_CLIENT_ID,
      googleSecret: Config.OAUTH_GOOGLE_SECRET,
      facebookId: Config.OAUTH_FACEBOOK_CLIENT_ID,
      facebookSecret: Config.OAUTH_FACEBOOK_SECRET,
    }),
    app.register(Swagger),
  ]);
}
