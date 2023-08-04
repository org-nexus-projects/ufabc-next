import type {
  Device,
  User,
  UserMethods,
  UserModel as UserModelType,
  UserVirtuals,
} from '@ufabcnext/types';
import { Schema, model } from 'mongoose';
import { uniqBy } from 'remeda';
// import { sign as jwtSign } from 'jsonwebtoken';

const userSchema = new Schema<User, UserModelType, UserMethods, UserVirtuals>(
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

userSchema.virtual('isFilled').get(function () {
  return this.ra && this.email;
});

userSchema.method('addDevice', function (this: User, device: Device) {
  this.devices.unshift(device);
  const uniqueDevice = uniqBy(this.devices, (device) => device.deviceId);
  this.devices = uniqueDevice;
});

userSchema.method('removeDevice', function (this: User, deviceId: string) {
  this.devices = this.devices.filter((device) => device.deviceId !== deviceId);
});

userSchema.method('generateJWT', function (this: User) {});

userSchema.method('sendConfirmation', async function (this) {});

userSchema.pre('save', async function (this) {
  // Make it possible to point to the `isFilled` virtual
  if (this.isFilled && !this.confirmed) {
    await this.sendConfirmation();
  }
});

export const UserModel = model<User, UserModelType>('User', userSchema);
