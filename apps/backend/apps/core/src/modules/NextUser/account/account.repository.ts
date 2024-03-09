import type { FilterQuery } from 'mongoose';
import type { User, UserDocument, UserModel } from '@/models/User.js';

interface NextAccountRepository {
  findUnique(options: FilterQuery<User>): Promise<UserDocument | null>;
}

export class AccountRepository implements NextAccountRepository {
  constructor(private readonly userService: typeof UserModel) {}
  async findUnique(options: FilterQuery<User>) {
    const nextUser = await this.userService.findOne<UserDocument>(options);
    return nextUser;
  }
}
