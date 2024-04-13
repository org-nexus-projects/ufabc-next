import { UserModel } from '@/models/User.js';
import type { NextOAuth2User } from './utils/oauthTypes.js';

export async function createIfNotExists(
  oauthUser: NextOAuth2User,
  userId?: string,
) {
  const findUserQuery: Record<string, string>[] = [
    { 'oauth.providerId': oauthUser.providerId },
  ];

  if (userId) {
    findUserQuery.push({ _id: userId.split('?')[0] });
  }

  const user =
    (await UserModel.findOne({ $or: findUserQuery })) ?? new UserModel();

  user.set({
    active: true,
    'oauth.providerId': oauthUser.providerId,
    'oauth.email': oauthUser.email,
    'oauth.provider': oauthUser.provider,
  });

  await user.save();

  return user;
}
