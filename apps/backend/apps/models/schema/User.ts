import { TextEncoder } from 'node:util';
import {
  type InferSchemaType,
  Schema,
  type ValidatorProps,
  model,
} from 'mongoose';
import { uniqBy } from 'remeda';
import { SignJWT } from 'jose';
import { sendEmailJob } from '@ufabcnext/queue';
import { Config } from '../config/config.js';

type Device = {
  deviceId: string;
  token: string;
  phone: string;
};

const userSchema = new Schema(
  {
    ra: {
      type: Number,
      unique: true,
      partialFilterExpression: { ra: { $exists: true } },
    },
    email: {
      type: String,
      validate: {
        validator: (v: string) => v.includes('ufabc.edu.br'),
        message: (props: ValidatorProps) =>
          `${props.value} não é um e-mail válido.`,
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
    permissions: [String],
    // updatedAt: NativeDate,
    // createdAt: NativeDate,
  },
  {
    methods: {
      addDevice(device: Device) {
        this.devices.unshift(device);
        const uniqueDevice = uniqBy(this.devices, (device) => device.deviceId);
        this.devices = uniqueDevice;
      },
      removeDevice(deviceId: string) {
        this.devices = this.devices.filter(
          (device) => device.deviceId !== deviceId,
        );
      },
      async sendConfirmation() {
        const nextUser = this.toObject({ virtuals: true });
        await sendEmailJob(nextUser);
      },
      generateJWT() {
        const alg = 'HS256';
        const encodedSecret = new TextEncoder().encode(Config.JWT_SECRET);
        const signedPayload = new SignJWT({
          _id: this._id,
          ra: this.ra,
          confirmed: this.confirmed,
          email: this.email,
          permissions: this.permissions,
        });
        return signedPayload.setProtectedHeader({ alg }).sign(encodedSecret);
      },
    },
    virtuals: {
      isFilled: {
        get() {
          return this.ra && this.email;
        },
      },
    },
    timestamps: true,
  },
);

userSchema.pre<UserDocument>('save', async function () {
  if (this.isFilled && !this.confirmed) {
    await this.sendConfirmation();
  }
});

export type User = InferSchemaType<typeof userSchema>;
export type UserDocument = ReturnType<(typeof UserModel)['hydrate']>;
export const UserModel = model('users', userSchema);
