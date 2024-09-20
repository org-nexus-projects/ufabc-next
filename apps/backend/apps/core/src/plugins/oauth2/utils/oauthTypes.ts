import type { User } from '@/models/User.js';
import type {
  Credentials,
  ProviderConfiguration,
  Token,
} from '@fastify/oauth2';

const SOURCE_TYPE = {
  SOURCE_TYPE_UNSPECIFIED: 'SOURCE_TYPE_UNSPECIFIED',
  ACCOUNT: 'ACCOUNT',
  PROFILE: 'PROFILE',
  DOMAIN_PROFILE: 'DOMAIN_PROFILE',
  CONTACT: 'CONTACT',
  OTHER_CONTACT: 'OTHER_CONTACT',
  DOMAIN_CONTACT: 'DOMAIN_CONTACT	',
} as const;
type SourceType = keyof typeof SOURCE_TYPE;

type Metadata = {
  primary: boolean;
  verified: boolean;
  source: {
    type: SourceType;
    id: string;
  };
  sourcePrimary: boolean;
};

type EmailAddresses = {
  metadata: Metadata;
  value: string;
};

/**
 * @link https://developers.google.com/people/api/rest/v1/people?hl=pt-br#resource:-person
 */
export type GoogleUser = {
  readonly resourceName: string;
  readonly etag: string;
  emailAddresses: EmailAddresses[];
};

/**
 * @description Necessario devio ao token de oauth que utilizamos,
 * user do antigo endpoint de oauth da google
 */
export type LegacyGoogleUser = {
  id: string;
  displayName: string;
  image: {
    url: string;
  };
  emails: Array<{ value: string; account: string }>;
  nickname: string;
  language: string;
  kind: string;
  etag: string;
};

export type ProviderName = 'google' | 'facebook';
type ProviderConfig = {
  config: ProviderConfiguration;
  scope: string[];
  credentials: Omit<Credentials, 'auth'>;
  getUserDetails: (token: Token) => Promise<User['oauth']>;
};
export type Providers = Record<ProviderName, ProviderConfig>;
