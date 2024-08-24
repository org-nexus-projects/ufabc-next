import { type User, UserModel } from '@/models/User.js';
import { logger } from '@next/common';

export async function createIfNotExists(
  oauthUser: User['oauth'],
  userId?: string,
) {
  logger.warn(oauthUser, 'query ts');
  const findUserQuery: Record<string, string>[] = [
    // @ts-expect-error
    { 'oauth.google': oauthUser?.google },
  ];
  if (userId) {
    const [queryId] = userId.split('?');
    findUserQuery.push({ _id: queryId });
  }

  const user =
    (await UserModel.findOne({ $or: findUserQuery })) || new UserModel();

  user.set({
    active: true,
    oauth: {
      google: oauthUser?.google,
      emailGoogle: oauthUser?.emailGoogle,
      email: oauthUser?.email,
    },
  });

  await user.save();

  return user;
}
