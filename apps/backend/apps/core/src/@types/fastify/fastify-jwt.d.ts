import type { ObjectId } from 'mongoose';
import type { User } from '@ufabcnext/types';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      _id: ObjectId;
      confirmed: boolean;
      iat: number;
    };
    // TODO: fix this type
    user: User | null;
  }
}
