import type {
  User,
  UserMethods,
  UserModel as UserModelType,
} from '@ufabcnext/types';
import { Schema, model } from 'mongoose';

const userSchema = new Schema<User, UserModelType, UserMethods>(
  {
    ra: {
      type: Number,
      unique: true,
      partialFilterExpression: { ra: { $exists: true } },
    },
    email: {
      type: String,
      validate: {
        validator: (v: string) => v.indexOf('ufabc.edu.br') !== -1,
        message: (props) => `${props.value} não é um e-mail válido.`,
      },
      unique: true,
      partialFilterExpression: { email: { $exists: true } },
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    oauth: {
      email: String,
      provider: String,
      providerId: String,
      picture: String,
    },
    devices: [
      {
        phone: String,
        token: {
          type: String,
          required: true,
        },
        deviceId: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true },
);

// Need to understand here
// eslint-disable-next-line
export const UserModel = model<User, UserModelType>('User', userSchema);
