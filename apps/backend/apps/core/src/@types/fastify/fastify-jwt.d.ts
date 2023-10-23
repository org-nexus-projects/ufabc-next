import type { ObjectId } from 'mongoose';
import type { UserDocument } from '@next/models';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      _id: ObjectId;
      confirmed: boolean;
      iat: number;
    };
    user: UserDocument | null;
  }
}
