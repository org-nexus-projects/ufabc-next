import { z } from 'zod';
import type { ObjectId } from 'mongoose';
import type { AccountRepository } from './account.repository.js';

export class AccountService {
  constructor(private readonly accountRepository: AccountRepository) {}

  async findUnique(userNotConfirmed: string) {
    const parsedUserToken = z.object({
      email: z.string().email(),
    });

    const response = parsedUserToken.parse(JSON.parse(userNotConfirmed));
    const user = await this.accountRepository.findUnique({
      email: response.email,
      active: true,
    });
    // maybe zod here?
    return user;
  }

  async setNextUfFields(
    body: { ra: number; email: string },
    userEmail: string | null,
  ) {
    const UFStudent = z.object({
      email: z.string().email(),
      ra: z.number(),
    });

    const { email, ra } = UFStudent.parse(body);

    const nonConfirmedUser = await this.accountRepository.findUnique({
      email: userEmail,
    });

    if (!nonConfirmedUser) {
      throw new Error('User not found');
    }

    nonConfirmedUser?.set({ email, ra });

    nonConfirmedUser?.save();

    return nonConfirmedUser;
  }

  async findUniqueSession(_id: ObjectId | undefined) {
    const sessionUser = await this.accountRepository.findUnique({
      active: true,
      _id,
    });
    return sessionUser;
  }
}
