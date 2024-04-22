import {
  type InferSchemaType,
  Schema,
  type ValidatorProps,
  model,
} from 'mongoose';
import jwt from 'jsonwebtoken';
import { mongooseLeanVirtuals } from 'mongoose-lean-virtuals';
import { nextJobs } from '@/queue/NextJobs.js';
import { Config } from '@/config/config.js';

const INTEGRATED_PROVIDERS = ['facebook', 'google'] as const;

const providerSchema = new Schema(
  {
    provider: {
      type: String,
      enum: INTEGRATED_PROVIDERS,
      default: null,
    },
    id: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    ra: {
      type: Number,
      unique: true,
      partialFilterExpression: { ra: { $exists: true } },
      default: null,
    },
    email: {
      type: String,
      validate: {
      validator: (email: string) => email.includes('ufabc.edu.br'),
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
    oauth: [providerSchema],
    devices: [
      {
        phone: {
          type: String,
          required: true,
        },
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
  },
  {
    methods: {
      addDevice(device: (typeof this.devices)[number]) {
        this.devices.unshift(device);

        const uniqueDevices = [];
        const uniqueDeviceIds = new Set<string>();
        for (const device of this.devices) {
          if (!uniqueDeviceIds.has(device.id)) {
            uniqueDevices.push(device);
            uniqueDeviceIds.add(device.deviceId);
          }
        }

        this.devices = uniqueDevices as typeof this.devices;
      },
      removeDevice(deviceId: string) {
        this.devices = this.devices.filter(
          (device) => device.deviceId !== deviceId,
        ) as typeof this.devices;
      },
      async sendConfirmation() {
        const nextUser = this.toObject({
          virtuals: true,
        });
        await nextJobs.dispatch('NextSendEmail', nextUser);
      },
      generateJWT() {
        return jwt.sign(
          {
            _id: this._id,
            ra: this.ra,
            confirmed: this.confirmed,
            email: this.email,
            permissions: this.permissions,
          },
          Config.JWT_SECRET,
        );
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

userSchema.plugin(mongooseLeanVirtuals);

userSchema.pre<UserDocument>('save', async function () {
  if (this.isFilled && !this.confirmed) {
    await this.sendConfirmation();
  }
});

export type AccountProvider = InferSchemaType<typeof providerSchema>;
export type User = InferSchemaType<typeof userSchema>;
export type UserDocument = ReturnType<(typeof UserModel)['hydrate']>;
export const UserModel = model('users', userSchema);
