import { UFABC_EMAIL_DOMAINS } from '@/constants.js';
import { UserModel } from '@/models/User.js';

// ponytail: alunos.login is legacy-populated with a stringified RA for a
// large share of records (see the entities/students and v2/students PUT
// handlers), not the real username, so matching alunos by login directly
// misses. Resolve the login to its RA via the users collection instead,
// until the alunos login field is fully backfilled and the write path that
// stores the wrong value is fixed at the source.
export async function findRaByLogin(login: string): Promise<number | null> {
  const candidateEmails = UFABC_EMAIL_DOMAINS.map(
    (domain) => `${login}@${domain}`
  );
  const user = await UserModel.findOne({ email: { $in: candidateEmails } });

  return user?.ra ?? null;
}
