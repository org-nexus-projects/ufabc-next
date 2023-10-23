import type { Model, ObjectId, Schema } from 'mongoose';

export type User = {
  _id?: string;
  email: string;
  oauth: {
    email: string;
    provider: string;
    providerId: string;
    picture?: string | undefined;
  };
  confirmed: boolean;
  ra: number;
  active: boolean;
  permissions: string[];
  createdAt: string;
  // devices: Device[];
};

export type UserMethods = {
  // addDevice(device: User['devices']): void;
  removeDevice(deviceId: ObjectId): ObjectId[];
  sendConfirmation(): Promise<void>;
  generateJWT(): string;
};

export type UserVirtuals = {
  isFilled(): string | number;
};

export type UserModel = Model<User, unknown, UserMethods, UserVirtuals>;
// Just in case
export type UserSchema = Schema<User, UserModel, UserMethods>;
