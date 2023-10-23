import type { ObjectId } from 'mongoose';
import type { User, UserDocument } from '@next/models';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      _id: ObjectId;
      confirmed: boolean;
      iat: number;
    };
    // TODO: fix this type
    user: UserDocument | null;
  }
}
