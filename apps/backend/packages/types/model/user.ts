import type { Model, ObjectId, Schema } from 'mongoose';

export type User = {
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
  devices: {
    deviceId: string;
    token: string;
    phone: string;
  }[];
};

export type UserMethods = {
  addDevice(device: User['devices']): void;
  removeDevice(deviceId: ObjectId): ObjectId[];
  sendConfirmation(): Promise<void>;
  generateJWT(): string;
};

export type UserModel = Model<User, unknown, UserMethods>;
// Just in case
export type UserSchema = Schema<User, UserModel, UserMethods>;
