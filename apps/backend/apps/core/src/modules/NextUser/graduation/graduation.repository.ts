import type {
  Graduation,
  GraduationDocument,
  GraduationModel,
} from '@/models/Graduation.js';
import type { FilterQuery } from 'mongoose';

interface UserGraduationRepository {
  findGraduation(
    options?: FilterQuery<Graduation>,
    limit?: number,
  ): Promise<GraduationDocument[]>;
}

export class GraduationRepository implements UserGraduationRepository {
  constructor(private readonly graduationService: typeof GraduationModel) {}

  async findGraduation(options: FilterQuery<Graduation>, limit: number = 200) {
    const graduations = await this.graduationService
      // eslint-disable-next-line unicorn/no-array-callback-reference
      .find(options)
      .lean<GraduationDocument[]>({ virtuals: true })
      .limit(limit);
    return graduations;
  }
}
