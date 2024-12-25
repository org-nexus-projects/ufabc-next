type OAuth = {
  email: string;
  facebook: string;
  picture: string;
  emailFacebook: string;
  google: string;
  emailGoogle: string;
};

type Device = {
  _id: string;
  deviceId: string;
  token: string;
  phone: string;
};

export type User = {
  _id: string;
  oauth: OAuth;
  confirmed: boolean;
  email?: string;
  ra: number;
  createdAt: string;
  devices: Device[];
  permissions: string[];
};
