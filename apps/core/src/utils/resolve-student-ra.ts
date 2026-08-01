import { UFABC_EMAIL_DOMAINS } from '@/constants.js';
import { UserModel } from '@/models/User.js';

export async function findRaByLogin(login: string): Promise<number | null> {
  const candidateEmails = UFABC_EMAIL_DOMAINS.map(
    (domain) => `${login}@${domain}`
  );
  const user = await UserModel.findOne({ email: { $in: candidateEmails } });

  return user?.ra ?? null;
}
