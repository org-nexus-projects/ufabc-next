// Implement here the types that your resource provider gives
// TODO: implement zod here to validate this data
import type {
  Credentials,
  ProviderConfiguration,
  Token,
} from '@fastify/oauth2';

export type ProviderName = 'google' | 'facebook';
type ProviderConfig = {
  config: ProviderConfiguration;
  scope: string[];
  credentials: Omit<Credentials, 'auth'>;
  getUserDetails: (token: Token) => Promise<NextOAuth2User>;
};
export type Providers = Record<ProviderName, ProviderConfig>;

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

export type NextOAuth2User = {
  email: string;
  providerId: string;
  provider: string;
  picture?: string;
};
