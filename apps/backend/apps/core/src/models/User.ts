import {
  type InferSchemaType,
  Schema,
  type ValidatorProps,
  model,
} from 'mongoose';

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
        validator: (email: string) =>
          email ? email.includes('ufabc.edu.br') : true,
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
    expiresAt: {
      type: Date,
      default: null,
      index: { expireAfterSeconds: 0 },
    },
    active: {
      type: Boolean,
      default: true,
    },
    oauth: {
      facebook: String,
      emailFacebook: String,
      google: String,
      emailGoogle: String,
      email: String,
      picture: String,
    },
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
    permissions: { type: [String], default: [] },
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
          (device) => device.deviceId !== deviceId
        ) as typeof this.devices;
      },
    },
    timestamps: true,
  }
);

type UserBase = InferSchemaType<typeof userSchema>;
export type User = Omit<UserBase, 'expiresAt'> & { expiresAt: Date | null };

export type UserDocument = ReturnType<(typeof UserModel)['hydrate']>;
export const UserModel = model<User>('users', userSchema);
