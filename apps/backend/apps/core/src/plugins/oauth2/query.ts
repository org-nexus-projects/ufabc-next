import { type AccountProvider, UserModel } from '@/models/User.js';

export async function createIfNotExists(
  oauthUser: AccountProvider,
  userId?: string,
) {
  const findUserQuery: Record<string, string>[] = [
    { "oauth.providerId": oauthUser.provider },
  ];

  if (userId) {
    const [queryId] = userId.split("?");
    findUserQuery.push({ _id: queryId });
  }

  const user =
    (await UserModel.findOne({ $or: findUserQuery })) || new UserModel();

  user.set({
    active: true,
    oauth: [{
      provider: oauthUser.provider,
      id: oauthUser.id,
      email: oauthUser.email,
    }],
   
  });

  await user.save();

  return user;
}
